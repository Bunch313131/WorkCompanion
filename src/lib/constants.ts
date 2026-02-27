// App branding - easy to update with final name/logo
export const APP_NAME = 'L.A.R.R.E.'
export const APP_FULL_NAME = 'Largely Automated Record Repository, Eventually'
export const APP_TAGLINE = 'Largely Automated Record Repository, Eventually'
export const APP_LOGO: string | null = `${import.meta.env.BASE_URL}logo.png`

export const TAG_COLORS = [
  { name: 'Red', value: '#ef4444', bg: '#fef2f2' },
  { name: 'Orange', value: '#f97316', bg: '#fff7ed' },
  { name: 'Amber', value: '#f59e0b', bg: '#fffbeb' },
  { name: 'Green', value: '#10b981', bg: '#ecfdf5' },
  { name: 'Teal', value: '#14b8a6', bg: '#f0fdfa' },
  { name: 'Blue', value: '#3b82f6', bg: '#eff6ff' },
  { name: 'Indigo', value: '#6366f1', bg: '#eef2ff' },
  { name: 'Purple', value: '#8b5cf6', bg: '#f5f3ff' },
  { name: 'Pink', value: '#ec4899', bg: '#fdf2f8' },
  { name: 'Slate', value: '#64748b', bg: '#f8fafc' },
] as const

export const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: '#ef4444', bg: '#fef2f2', darkBg: '#451a1a' },
  high: { label: 'High', color: '#f97316', bg: '#fff7ed', darkBg: '#451a00' },
  medium: { label: 'Medium', color: '#f59e0b', bg: '#fffbeb', darkBg: '#451a00' },
  low: { label: 'Low', color: '#3b82f6', bg: '#eff6ff', darkBg: '#1e2a4a' },
} as const

export const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'] as const

export const TASK_STATUS_CONFIG = {
  todo: { label: 'To Do', color: '#64748b' },
  in_progress: { label: 'In Progress', color: '#3b82f6' },
  review: { label: 'Review', color: '#f59e0b' },
  done: { label: 'Done', color: '#10b981' },
} as const

export const QUICK_SHARE_EXPIRY_OPTIONS = [
  { label: '24 hours', value: 24 },
  { label: '48 hours', value: 48 },
  { label: '7 days', value: 168 },
  { label: 'Never', value: 0 },
] as const

export const NOTE_TEMPLATES = [
  {
    name: 'Meeting Minutes',
    content: `<h2>Meeting Minutes</h2><p><strong>Date:</strong> </p><p><strong>Attendees:</strong> </p><p><strong>Location:</strong> </p><hr><h3>Agenda</h3><ul><li></li></ul><h3>Discussion</h3><p></p><h3>Action Items</h3><ul data-type="taskList"><li data-type="taskItem" data-checked="false"></li></ul><h3>Next Meeting</h3><p></p>`,
  },
  {
    name: 'Daily Field Report',
    content: `<h2>Daily Field Report</h2><p><strong>Date:</strong> </p><p><strong>Project:</strong> </p><p><strong>Weather:</strong> </p><hr><h3>Work Completed Today</h3><ul><li></li></ul><h3>Manpower</h3><p></p><h3>Equipment on Site</h3><p></p><h3>Issues / Delays</h3><p></p><h3>Photos</h3><p></p>`,
  },
  {
    name: 'RFI',
    content: `<h2>Request for Information</h2><p><strong>RFI #:</strong> </p><p><strong>Date:</strong> </p><p><strong>Project:</strong> </p><p><strong>To:</strong> </p><p><strong>From:</strong> </p><hr><h3>Question</h3><p></p><h3>Reference Documents</h3><p></p><h3>Suggested Solution</h3><p></p><h3>Response</h3><p></p>`,
  },
  {
    name: 'Phone Log',
    content: `<h2>Phone Log</h2><p><strong>Date/Time:</strong> </p><p><strong>Contact:</strong> </p><p><strong>Company:</strong> </p><p><strong>Phone:</strong> </p><hr><h3>Discussion</h3><p></p><h3>Follow-up Required</h3><ul data-type="taskList"><li data-type="taskItem" data-checked="false"></li></ul>`,
  },
  {
    name: 'General Note',
    content: `<h2>Note</h2><p></p>`,
  },
] as const
