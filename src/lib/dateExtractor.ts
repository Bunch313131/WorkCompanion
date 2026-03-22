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
        if (col.length > 2) {
          // If very long (multi-paragraph cell content), take first sentence
          if (col.length > 120) {
            const firstSentence = col.split(/[.\n]/).find(s => s.trim().length > 2)
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
        if (cleaned.length > 2) return cleaned
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
      if (cleaned.length > 2) return cleaned
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
        !/^\d[\d\s\/\-\.,:]+$/.test(c)
      )
      if (candidates.length > 0) {
        let best = candidates[0]
        // Remove task numbering prefix
        best = best.replace(/^(Task\s*#?\d+|WS\s*#?\d+|LCWG\s*#?\d+)\s*/gi, '').trim()
        if (best.length > 120) {
          const firstSentence = best.split(/[.\n]/).find(s => s.trim().length > 2)
          if (firstSentence) return firstSentence.trim()
        }
        if (best.length > 2) return best
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
      !/^\d[\d\s\/\-\.,:]+$/.test(cleaned)
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

  // Pattern 1: "Month DD, YYYY" or "Month DD YYYY"
  const p1 = /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})?\b/gi
  let m: RegExpExecArray | null
  while ((m = p1.exec(text)) !== null) {
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
            const end = new Date(match.date)
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
