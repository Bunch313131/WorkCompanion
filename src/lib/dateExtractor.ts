import type { IcsEvent, RecurrenceRule } from '@/types/ics'
import { generateId } from '@/lib/utils'

interface RawDateMatch {
  date: Date
  text: string
  context: string       // surrounding text for title/description
  hasTime: boolean
  endDate?: Date
  recurrence?: RecurrenceRule | null
  confidence: number
}

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]
const MONTHS_SHORT = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

function monthIndex(m: string): number {
  const lower = m.toLowerCase()
  let idx = MONTHS.indexOf(lower)
  if (idx >= 0) return idx
  idx = MONTHS_SHORT.indexOf(lower.substring(0, 3))
  return idx
}

function parseTimeString(timeStr: string): { hours: number; minutes: number } | null {
  // "2:30 PM", "14:30", "2pm", "2:30pm"
  const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?/i)
  if (!match) return null
  const hasColon = timeStr.includes(':')
  const hasMeridian = !!match[3]
  // Require either a colon or am/pm — bare numbers like "17" are NOT times
  if (!hasColon && !hasMeridian) return null
  let hours = parseInt(match[1], 10)
  const minutes = match[2] ? parseInt(match[2], 10) : 0
  const meridian = match[3]?.replace(/\./g, '').toLowerCase()
  if (meridian === 'pm' && hours < 12) hours += 12
  if (meridian === 'am' && hours === 12) hours = 0
  if (hours > 23 || minutes > 59) return null
  return { hours, minutes }
}

function getContextAround(text: string, matchStart: number, matchEnd: number, radius = 300): string {
  // Grab several lines before and after the match for better context
  const start = Math.max(0, matchStart - radius)
  const end = Math.min(text.length, matchEnd + radius)
  return text.substring(start, end).trim()
}

function isGarbageTitle(title: string): boolean {
  const t = title.trim()
  if (t.length < 3) return true
  // Reject "and 18", "and 21", "or 5", etc. — leftover from range text
  if (/^(and|or|to|from|the|a|an|of|in|on|at|by)\s+\d+$/i.test(t)) return true
  // Reject bare numbers or number-only strings
  if (/^\d[\d\s,.\-\/]*$/.test(t)) return true
  // Reject mid-word fragments (starts with lowercase and no spaces = likely truncated)
  if (/^[a-z]/.test(t) && t.length < 8 && !t.includes(' ')) return true
  // Reject if it's just a partial word ending (e.g., "nitiation of", "ommittee")
  if (/^[a-z]{2,}tion\b|^[a-z]{2,}ment\b|^[a-z]{2,}ity\b|^[a-z]{2,}ing\b/i.test(t) && /^[a-z]/.test(t)) return true
  return false
}

function inferTitleFromContext(context: string, dateText: string): string {
  const lines = context.split('\n').map(l => l.trim()).filter(Boolean)

  // Find which line contains the date match
  const dateLineIdx = lines.findIndex(l => l.includes(dateText.trim()))

  // Strategy 1: Table column extraction
  // If the date line has tab separators (table columns), look at the column before the date
  if (dateLineIdx >= 0 && lines[dateLineIdx].includes('\t')) {
    const columns = lines[dateLineIdx].split('\t').map(c => c.trim()).filter(Boolean)
    const dateColIdx = columns.findIndex(c => c.includes(dateText.trim()))
    if (dateColIdx > 0) {
      for (let i = dateColIdx - 1; i >= 0; i--) {
        let col = columns[i]
        // Remove task/workshop numbering prefixes
        col = col.replace(/^(Task\s*#?\d+|WS\s*#?\d+|LCWG\s*#?\d+)\s*/gi, '').trim()
        if (col.length > 2 && !isGarbageTitle(col)) {
          // If very long (multi-paragraph cell content), take first sentence
          if (col.length > 120) {
            const firstSentence = col.split(/[.\n]/).find(s => s.trim().length > 2 && !isGarbageTitle(s.trim()))
            if (firstSentence) return firstSentence.trim()
          }
          return col
        }
      }
    }
    // Also check columns after the date (comments column might have useful info)
    // but prefer columns before
  }

  // Strategy 2: Same line, non-table - extract title from text around the date
  if (dateLineIdx >= 0) {
    const dateLine = lines[dateLineIdx]
    const datePos = dateLine.indexOf(dateText.trim())

    // Try text before the date first
    if (datePos > 0) {
      const beforeDate = dateLine.substring(0, datePos).replace(/[\s\-–—:|,;•]+$/g, '').trim()
      if (beforeDate.length > 2 && beforeDate.length < 150) {
        const cleaned = beforeDate
          .replace(/\d{1,2}(:\d{2})?\s*(am|pm|a\.m\.|p\.m\.)/gi, '')
          .replace(/^\d{1,2}:\d{2}\s*/, '')
          .replace(/^[\s\-–—:|,;•]+|[\s\-–—:|,;•]+$/g, '')
          .trim()
        if (cleaned.length > 2 && !isGarbageTitle(cleaned)) return cleaned
      }
    }

    // Try text after the date
    const afterDate = dateLine.substring(datePos + dateText.trim().length)
      .replace(/^[\s\-–—:|,;•]+/, '').trim()
    if (afterDate.length > 2 && afterDate.length < 150) {
      const cleaned = afterDate
        .replace(/\d{1,2}(:\d{2})?\s*(am|pm|a\.m\.|p\.m\.)/gi, '')
        .replace(/^\d{1,2}:\d{2}\s*/, '')
        .replace(/^[\s\-–—:|,;•]+|[\s\-–—:|,;•]+$/g, '')
        .trim()
      if (cleaned.length > 2 && !isGarbageTitle(cleaned)) return cleaned
    }
  }

  // Strategy 3: Search nearby lines (up to 10 before and after)
  const searchOrder: number[] = []
  if (dateLineIdx >= 0) {
    for (let i = 1; i <= 10; i++) {
      if (dateLineIdx - i >= 0) searchOrder.push(dateLineIdx - i)
    }
    for (let i = 1; i <= 5; i++) {
      if (dateLineIdx + i < lines.length) searchOrder.push(dateLineIdx + i)
    }
  } else {
    for (let i = 0; i < lines.length; i++) searchOrder.push(i)
  }

  const datePattern = /^\d{1,2}[\/:.\-]\d{1,2}[\/:.\-]\d{2,4}$|^\d{4}-\d{2}-\d{2}$|^\d{1,2}(:\d{2})?\s*(am|pm)$/i
  const timeOnlyPattern = /^\d{1,2}(:\d{2})?\s*(am|pm|a\.m\.|p\.m\.)\s*[-–to]*\s*\d{1,2}(:\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?$/i

  for (const idx of searchOrder) {
    let line = lines[idx]
    // For tab-separated lines, try to extract the best column (prefer topic-like columns)
    if (line.includes('\t')) {
      const cols = line.split('\t').map(c => c.trim()).filter(Boolean)
      // Skip first column if it looks like a task number
      const candidates = cols.filter(c =>
        c.length > 2 && c.length < 150 &&
        !/^(Task\s*#?\d+|WS\s*#?\d+|LCWG\s*#?\d+)$/i.test(c) &&
        !datePattern.test(c) && !timeOnlyPattern.test(c) &&
        !/^\d[\d\s\/\-\.,:]+$/.test(c) &&
        !isGarbageTitle(c)
      )
      if (candidates.length > 0) {
        let best = candidates[0]
        // Remove task numbering prefix
        best = best.replace(/^(Task\s*#?\d+|WS\s*#?\d+|LCWG\s*#?\d+)\s*/gi, '').trim()
        if (best.length > 120) {
          const firstSentence = best.split(/[.\n]/).find(s => s.trim().length > 2 && !isGarbageTitle(s.trim()))
          if (firstSentence) return firstSentence.trim()
        }
        if (best.length > 2 && !isGarbageTitle(best)) return best
      }
      continue
    }
    const cleaned = line.replace(/^[\-\*\#\•\d\.]+\s*/, '').trim()
    if (
      cleaned.length > 2 &&
      cleaned.length < 150 &&
      !datePattern.test(cleaned) &&
      !timeOnlyPattern.test(cleaned) &&
      cleaned !== dateText.trim() &&
      !/^\d[\d\s\/\-\.,:]+$/.test(cleaned) &&
      !isGarbageTitle(cleaned)
    ) {
      return cleaned
    }
  }

  return 'Event'
}

function detectRecurrence(context: string): RecurrenceRule | null {
  const lower = context.toLowerCase()

  if (/every\s+day|daily/i.test(lower)) {
    return { freq: 'DAILY', interval: 1 }
  }
  if (/every\s+week|weekly/i.test(lower)) {
    return { freq: 'WEEKLY', interval: 1 }
  }
  if (/bi[\-\s]?weekly|every\s+(other|two|2)\s+week/i.test(lower)) {
    return { freq: 'WEEKLY', interval: 2 }
  }
  if (/every\s+month|monthly/i.test(lower)) {
    return { freq: 'MONTHLY', interval: 1 }
  }
  if (/every\s+(quarter|3\s+months)|quarterly/i.test(lower)) {
    return { freq: 'MONTHLY', interval: 3 }
  }
  if (/every\s+year|yearly|annually|annual/i.test(lower)) {
    return { freq: 'YEARLY', interval: 1 }
  }

  return null
}

export function extractDatesFromText(text: string): IcsEvent[] {
  const matches: RawDateMatch[] = []
  const currentYear = new Date().getFullYear()
  // Track positions consumed by range patterns so individual patterns skip them
  const rangeSpans: Array<{ start: number; end: number }> = []

  function isInRange(index: number): boolean {
    return rangeSpans.some(s => index >= s.start && index < s.end)
  }

  const MONTH_NAMES = 'january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec'

  // === Date Range Patterns (run first to catch multi-day events) ===

  // Range Pattern A: "Month DD-DD, YYYY" or "Month DD-DD" (same month range)
  // e.g., "March 22-25, 2026", "June 5-8", "March 22nd-25th"
  const rpA = new RegExp(
    `\\b(${MONTH_NAMES})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s*[-–—]+\\s*(\\d{1,2})(?:st|nd|rd|th)?,?\\s*(\\d{4})?\\b`,
    'gi'
  )
  let m: RegExpExecArray | null
  while ((m = rpA.exec(text)) !== null) {
    const month = monthIndex(m[1])
    const startDay = parseInt(m[2], 10)
    const endDay = parseInt(m[3], 10)
    const year = m[4] ? parseInt(m[4], 10) : currentYear
    if (month >= 0 && startDay >= 1 && startDay <= 31 && endDay >= 1 && endDay <= 31 && endDay >= startDay) {
      const startDate = new Date(year, month, startDay)
      const endDate = new Date(year, month, endDay)
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const context = getContextAround(text, m.index, m.index + m[0].length)
        matches.push({
          date: startDate,
          text: m[0],
          context,
          hasTime: false,
          endDate,
          recurrence: detectRecurrence(context),
          confidence: m[4] ? 92 : 78,
        })
        rangeSpans.push({ start: m.index, end: m.index + m[0].length })
      }
    }
  }

  // Range Pattern A2: "Month DD and DD, YYYY" (same month, "and" separator)
  // e.g., "March 17 and 18", "July 15 and 16, 2026"
  const rpA2 = new RegExp(
    `\\b(${MONTH_NAMES})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s+and\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s*(\\d{4})?\\b`,
    'gi'
  )
  while ((m = rpA2.exec(text)) !== null) {
    const month = monthIndex(m[1])
    const startDay = parseInt(m[2], 10)
    const endDay = parseInt(m[3], 10)
    const year = m[4] ? parseInt(m[4], 10) : currentYear
    if (month >= 0 && startDay >= 1 && startDay <= 31 && endDay >= 1 && endDay <= 31) {
      const startDate = new Date(year, month, startDay)
      const endDate = new Date(year, month, endDay)
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const context = getContextAround(text, m.index, m.index + m[0].length)
        matches.push({
          date: startDate,
          text: m[0],
          context,
          hasTime: false,
          endDate,
          recurrence: detectRecurrence(context),
          confidence: m[4] ? 92 : 78,
        })
        rangeSpans.push({ start: m.index, end: m.index + m[0].length })
      }
    }
  }

  // Range Pattern B: "Month DD - Month DD, YYYY" or "Month DD, YYYY - Month DD, YYYY"
  // e.g., "March 22 - March 25, 2026", "Jan 5, 2026 - Jan 10, 2026"
  const rpB = new RegExp(
    `\\b(${MONTH_NAMES})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s*(\\d{4})?\\s*[-–—]+\\s*(${MONTH_NAMES})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s*(\\d{4})?\\b`,
    'gi'
  )
  while ((m = rpB.exec(text)) !== null) {
    const startMonth = monthIndex(m[1])
    const startDay = parseInt(m[2], 10)
    const startYear = m[3] ? parseInt(m[3], 10) : (m[6] ? parseInt(m[6], 10) : currentYear)
    const endMonth = monthIndex(m[4])
    const endDay = parseInt(m[5], 10)
    const endYear = m[6] ? parseInt(m[6], 10) : startYear
    if (startMonth >= 0 && endMonth >= 0 && startDay >= 1 && startDay <= 31 && endDay >= 1 && endDay <= 31) {
      const startDate = new Date(startYear, startMonth, startDay)
      const endDate = new Date(endYear, endMonth, endDay)
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate >= startDate) {
        const context = getContextAround(text, m.index, m.index + m[0].length)
        matches.push({
          date: startDate,
          text: m[0],
          context,
          hasTime: false,
          endDate,
          recurrence: detectRecurrence(context),
          confidence: (m[3] || m[6]) ? 92 : 78,
        })
        rangeSpans.push({ start: m.index, end: m.index + m[0].length })
      }
    }
  }

  // Range Pattern C: "MM/DD/YYYY - MM/DD/YYYY" (numeric date ranges)
  // e.g., "3/22/2026 - 3/25/2026", "03/22/26 - 03/25/26"
  const rpC = /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\s*[-–—]+\s*(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/g
  while ((m = rpC.exec(text)) !== null) {
    const a1 = parseInt(m[1], 10), b1 = parseInt(m[2], 10)
    let y1 = parseInt(m[3], 10)
    if (y1 < 100) y1 += 2000
    const a2 = parseInt(m[4], 10), b2 = parseInt(m[5], 10)
    let y2 = parseInt(m[6], 10)
    if (y2 < 100) y2 += 2000

    let sm = a1 - 1, sd = b1, em = a2 - 1, ed = b2
    if (sm < 0 || sm > 11 || sd < 1 || sd > 31) { sm = b1 - 1; sd = a1 }
    if (em < 0 || em > 11 || ed < 1 || ed > 31) { em = b2 - 1; ed = a2 }

    if (sm >= 0 && sm <= 11 && sd >= 1 && sd <= 31 && em >= 0 && em <= 11 && ed >= 1 && ed <= 31) {
      const startDate = new Date(y1, sm, sd)
      const endDate = new Date(y2, em, ed)
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate >= startDate) {
        const context = getContextAround(text, m.index, m.index + m[0].length)
        matches.push({
          date: startDate,
          text: m[0],
          context,
          hasTime: false,
          endDate,
          recurrence: detectRecurrence(context),
          confidence: 88,
        })
        rangeSpans.push({ start: m.index, end: m.index + m[0].length })
      }
    }
  }

  // Range Pattern D: "YYYY-MM-DD - YYYY-MM-DD" (ISO date ranges)
  const rpD = /\b(\d{4})-(\d{2})-(\d{2})\s*[-–—]+\s*(\d{4})-(\d{2})-(\d{2})\b/g
  while ((m = rpD.exec(text)) !== null) {
    const y1 = parseInt(m[1], 10), mo1 = parseInt(m[2], 10) - 1, d1 = parseInt(m[3], 10)
    const y2 = parseInt(m[4], 10), mo2 = parseInt(m[5], 10) - 1, d2 = parseInt(m[6], 10)
    if (y1 >= 1900 && y1 <= 2100 && y2 >= 1900 && y2 <= 2100) {
      const startDate = new Date(y1, mo1, d1)
      const endDate = new Date(y2, mo2, d2)
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime()) && endDate >= startDate) {
        const context = getContextAround(text, m.index, m.index + m[0].length)
        matches.push({
          date: startDate,
          text: m[0],
          context,
          hasTime: false,
          endDate,
          recurrence: detectRecurrence(context),
          confidence: 96,
        })
        rangeSpans.push({ start: m.index, end: m.index + m[0].length })
      }
    }
  }

  // Range Pattern E: "DD-DD Month YYYY" or "DD-DD Month" (day range before month)
  // e.g., "22-25 March 2026", "5-8 June"
  const rpE = new RegExp(
    `\\b(\\d{1,2})(?:st|nd|rd|th)?\\s*[-–—]+\\s*(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_NAMES})\\.?,?\\s*(\\d{4})?\\b`,
    'gi'
  )
  while ((m = rpE.exec(text)) !== null) {
    const startDay = parseInt(m[1], 10)
    const endDay = parseInt(m[2], 10)
    const month = monthIndex(m[3])
    const year = m[4] ? parseInt(m[4], 10) : currentYear
    if (month >= 0 && startDay >= 1 && startDay <= 31 && endDay >= 1 && endDay <= 31 && endDay >= startDay) {
      const startDate = new Date(year, month, startDay)
      const endDate = new Date(year, month, endDay)
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const context = getContextAround(text, m.index, m.index + m[0].length)
        matches.push({
          date: startDate,
          text: m[0],
          context,
          hasTime: false,
          endDate,
          recurrence: detectRecurrence(context),
          confidence: m[4] ? 92 : 78,
        })
        rangeSpans.push({ start: m.index, end: m.index + m[0].length })
      }
    }
  }

  // === Individual Date Patterns (skip positions already consumed by ranges) ===

  // Pattern 1: "Month DD, YYYY" or "Month DD YYYY"
  const p1 = /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?\b/gi
  while ((m = p1.exec(text)) !== null) {
    if (isInRange(m.index)) continue
    const month = monthIndex(m[1])
    const day = parseInt(m[2], 10)
    const year = m[3] ? parseInt(m[3], 10) : currentYear
    if (month >= 0 && day >= 1 && day <= 31) {
      const date = new Date(year, month, day)
      if (!isNaN(date.getTime())) {
        const context = getContextAround(text, m.index, m.index + m[0].length)
        matches.push({
          date,
          text: m[0],
          context,
          hasTime: false,
          recurrence: detectRecurrence(context),
          confidence: m[3] ? 90 : 75,
        })
      }
    }
  }

  // Pattern 2: "MM/DD/YYYY" or "MM-DD-YYYY" or "MM.DD.YYYY"
  const p2 = /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/g
  while ((m = p2.exec(text)) !== null) {
    if (isInRange(m.index)) continue
    const a = parseInt(m[1], 10)
    const b = parseInt(m[2], 10)
    let year = parseInt(m[3], 10)
    if (year < 100) year += 2000

    // Try MM/DD/YYYY (US format)
    let month = a - 1, day = b
    if (month < 0 || month > 11 || day < 1 || day > 31) {
      // Try DD/MM/YYYY
      month = b - 1
      day = a
    }
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const date = new Date(year, month, day)
      if (!isNaN(date.getTime())) {
        const context = getContextAround(text, m.index, m.index + m[0].length)
        matches.push({
          date,
          text: m[0],
          context,
          hasTime: false,
          recurrence: detectRecurrence(context),
          confidence: 85,
        })
      }
    }
  }

  // Pattern 3: "YYYY-MM-DD" (ISO)
  const p3 = /\b(\d{4})-(\d{2})-(\d{2})\b/g
  while ((m = p3.exec(text)) !== null) {
    if (isInRange(m.index)) continue
    const year = parseInt(m[1], 10)
    const month = parseInt(m[2], 10) - 1
    const day = parseInt(m[3], 10)
    if (year >= 1900 && year <= 2100 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const date = new Date(year, month, day)
      if (!isNaN(date.getTime())) {
        const context = getContextAround(text, m.index, m.index + m[0].length)
        matches.push({
          date,
          text: m[0],
          context,
          hasTime: false,
          recurrence: detectRecurrence(context),
          confidence: 95,
        })
      }
    }
  }

  // Pattern 4: "DD Month YYYY" (e.g., "15 March 2025")
  const p4 = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?,?\s*(\d{4})?\b/gi
  while ((m = p4.exec(text)) !== null) {
    if (isInRange(m.index)) continue
    const day = parseInt(m[1], 10)
    const month = monthIndex(m[2])
    const year = m[3] ? parseInt(m[3], 10) : currentYear
    if (month >= 0 && day >= 1 && day <= 31) {
      const date = new Date(year, month, day)
      if (!isNaN(date.getTime())) {
        const context = getContextAround(text, m.index, m.index + m[0].length)
        matches.push({
          date,
          text: m[0],
          context,
          hasTime: false,
          recurrence: detectRecurrence(context),
          confidence: m[3] ? 90 : 70,
        })
      }
    }
  }

  // Now try to find time patterns near each match
  for (const match of matches) {
    // Look for time in context
    const timePattern = /(?:at|@|from)?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?)\s*(?:[-–to]+\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?))?/gi
    const tm = timePattern.exec(match.context)
    if (tm) {
      const startTime = parseTimeString(tm[1])
      if (startTime) {
        match.hasTime = true
        match.date.setHours(startTime.hours, startTime.minutes)
        if (tm[2]) {
          const endTime = parseTimeString(tm[2])
          if (endTime) {
            const end = new Date(match.endDate || match.date)
            end.setHours(endTime.hours, endTime.minutes)
            match.endDate = end
          }
        }
      }
    }
  }

  // Deduplicate by date+time (keep highest confidence)
  const seen = new Map<string, RawDateMatch>()
  for (const match of matches) {
    const key = match.date.toISOString()
    const existing = seen.get(key)
    if (!existing || match.confidence > existing.confidence) {
      seen.set(key, match)
    }
  }

  // Convert to IcsEvent objects
  const events: IcsEvent[] = Array.from(seen.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((match) => {
      const title = inferTitleFromContext(match.context, match.text)
      const startDate = formatDateISO(match.date)
      const startTime = match.hasTime ? formatTime(match.date) : ''
      let endDate = startDate
      let endTime = ''
      if (match.endDate) {
        endDate = formatDateISO(match.endDate)
        endTime = formatTime(match.endDate)
      } else if (match.hasTime) {
        // Default to 1 hour duration
        const end = new Date(match.date.getTime() + 3600000)
        endDate = formatDateISO(end)
        endTime = formatTime(end)
      }

      return {
        id: generateId(),
        title,
        description: '',
        location: '',
        startDate,
        startTime,
        endDate,
        endTime,
        allDay: !match.hasTime,
        reminder: 15,
        recurrence: match.recurrence || null,
        confidence: match.confidence,
        sourceText: match.context.substring(0, 300),
      }
    })

  return events
}

function formatDateISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export async function extractTextFromFile(file: File): Promise<string> {
  const type = file.type

  if (type === 'application/pdf') {
    return extractTextFromPDF(file)
  }

  if (type.startsWith('text/') || type === 'application/rtf') {
    return file.text()
  }

  // For docx, xlsx, csv, etc. - read as text (best effort)
  if (
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    type === 'text/csv' ||
    type === 'application/csv'
  ) {
    return file.text()
  }

  // Fallback - try reading as text
  try {
    return await file.text()
  } catch {
    throw new Error(`Unsupported file type: ${type || file.name}`)
  }
}

async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  const workerModule = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')

  // Set up the worker using local file instead of CDN
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const textParts: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    // Use Y-position data to reconstruct line breaks
    // Use X-position gaps to detect table columns (insert \t)
    let lastY: number | null = null
    let lastEndX: number | null = null
    const lines: string[] = []
    let currentLine = ''
    for (const item of content.items as any[]) {
      if (!item.str) continue
      const y = item.transform?.[5]
      const x = item.transform?.[4]
      const itemWidth = item.width || 0

      // New line if Y changed significantly
      if (lastY !== null && y !== undefined && Math.abs(y - lastY) > 2) {
        lines.push(currentLine.trim())
        currentLine = ''
        lastEndX = null
      }

      // Detect column boundaries by large X-position gaps
      if (lastEndX !== null && x !== undefined) {
        const gap = x - lastEndX
        if (gap > 30) {
          currentLine += '\t'
        } else if (currentLine && !currentLine.endsWith('\t')) {
          currentLine += ' '
        }
      }

      currentLine += item.str
      if (x !== undefined) lastEndX = x + itemWidth
      if (y !== undefined) lastY = y
    }
    if (currentLine.trim()) lines.push(currentLine.trim())
    textParts.push(lines.filter(Boolean).join('\n'))
  }

  return textParts.join('\n\n')
}
