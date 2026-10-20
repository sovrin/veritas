/** The kinds of field a collection can have, with the name the admin shows for each. */
export const FIELD_TYPES = {
  text: 'Text',
  markdown: 'Markdown',
  number: 'Number',
  boolean: 'Yes / no',
  date: 'Date',
} as const

export type FieldType = keyof typeof FIELD_TYPES

/** How an error names what a field takes. */
export const FIELD_EXPECTS: Record<FieldType, string> = {
  text: 'text',
  markdown: 'text',
  number: 'a number',
  boolean: 'on or off',
  date: 'a date',
}

/** Field keys are what API consumers type: camelCase, starting with a letter. */
export const FIELD_KEY = /^[a-z][a-zA-Z0-9]{0,39}$/

/** Every delivered entry has these already, so no field may take their name. */
export const RESERVED_KEYS = ['slug', 'title', 'collection', 'updatedAt', 'published']

/** "Hero image" → "heroImage" */
export function fieldKey(label: string): string {
  const words = label.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().match(/[a-z0-9]+/g) ?? []
  const key = words.map((w, i) => (i ? w[0]!.toUpperCase() + w.slice(1) : w)).join('').replace(/^[0-9]+/, '')
  return key.slice(0, 40)
}

/** What an entry holds for a field nobody has filled in yet. */
export function emptyValue(type: FieldType): unknown {
  return type === 'number' ? null : type === 'boolean' ? false : ''
}

/** The value as the field's type stores it, or undefined when it can't be one. */
export function coerce(type: FieldType, value: unknown): unknown {
  if (value === undefined || value === null) return emptyValue(type)
  switch (type) {
    case 'text':
    case 'markdown':
      return typeof value === 'string' ? value : undefined
    case 'number':
      if (value === '') return null
      return typeof value === 'number' && Number.isFinite(value) ? value : undefined
    case 'boolean':
      return typeof value === 'boolean' ? value : undefined
    case 'date':
      return value === '' || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) ? value : undefined
  }
}
