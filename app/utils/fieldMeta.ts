import type { FieldType } from '#shared/utils/fields'

/** How each field type shows up in the admin: its icon, and one line on what it is for. */
export const FIELD_META: Record<FieldType, { icon: string; hint: string }> = {
  text: { icon: 'type', hint: 'A single line: names, headlines, links' },
  markdown: { icon: 'text-wrap', hint: 'Long text with formatting' },
  number: { icon: 'hash', hint: 'Prices, counts, ratings' },
  boolean: { icon: 'toggle-left', hint: 'On or off: featured, visible' },
  date: { icon: 'calendar', hint: 'A day, without a time' },
}

/** A field's value as one short line in a table cell. Empty values come back as an empty string. */
export function cell(type: FieldType, value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  if (type === 'boolean') return value ? 'Yes' : 'No'
  if (type === 'markdown') return String(value).replace(/[#>*_`~[\]()-]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120)
  return String(value)
}
