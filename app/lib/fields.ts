import type { FieldType } from '../../shared/contracts'

/** How each field type shows up in the admin: its icon, and one line on what it is for. */
export const FIELD_META: Record<FieldType, { icon: string; hint: string }> = {
  text: { icon: 'type', hint: 'A single line: names, headlines, links' },
  markdown: { icon: 'text-wrap', hint: 'Long text with formatting' },
  number: { icon: 'hash', hint: 'Prices, counts, ratings' },
  boolean: { icon: 'toggle-left', hint: 'On or off: featured, visible' },
  date: { icon: 'calendar', hint: 'A day, without a time' },
}

/** How a project's content is read, for the snippets on its pages. */
export const deliveryPath = (projectId: string, ...slugs: string[]) =>
  ['/v1/content', projectId, ...slugs].join('/')

/** The request a site reads a project's content with, for its Setup. */
export const deliverySnippet = (origin: string, projectId: string, token: string) =>
  `curl -H "Authorization: Bearer ${token}" ${origin}${deliveryPath(projectId)}`
