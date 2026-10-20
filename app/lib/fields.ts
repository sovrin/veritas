import type { FieldType } from '../../shared/contracts'

/** How each field type shows up in the admin: its icon, and one line on what it is for. */
export const FIELD_META: Record<FieldType, { icon: string; hint: string }> = {
  text: { icon: 'type', hint: 'A single line: names, headlines, links' },
  markdown: { icon: 'text-wrap', hint: 'Long text with formatting' },
  number: { icon: 'hash', hint: 'Prices, counts, ratings' },
  boolean: { icon: 'toggle-left', hint: 'On or off: featured, visible' },
  date: { icon: 'calendar', hint: 'A day, without a time' },
}

const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })
const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
const full = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

/** "14:32" for today, "6 Oct" before that: enough to tell entries apart in a list. */
export function shortDate(ms: number) {
  const date = new Date(ms)
  return date.toDateString() === new Date().toDateString() ? time.format(date) : day.format(date)
}

export const longDate = (ms: number) => full.format(new Date(ms))

/** How a project's content is read, for the snippets on its pages. */
export const deliveryPath = (projectId: string, ...slugs: string[]) =>
  ['/v1/content', projectId, ...slugs].join('/')
