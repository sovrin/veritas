import { Marked } from 'marked'

/** One change to a Markdown field: `insert` replaces the text from `from` to `to`, and the
 *  selection ends up from `start` to `end`. */
export interface MarkdownEdit {
  from: number
  to: number
  insert: string
  start: number
  end: number
}

/** **selection**, or the marks around the cursor with the cursor between them. */
export function wrap(text: string, start: number, end: number, mark: string): MarkdownEdit {
  const selected = text.slice(start, end)
  const inner = start + mark.length
  return {
    from: start,
    to: end,
    insert: mark + selected + mark,
    start: inner,
    end: inner + selected.length,
  }
}

/** [selection](https://), with the address selected for typing over. */
export function link(text: string, start: number, end: number): MarkdownEdit {
  const label = text.slice(start, end) || 'text'
  const url = start + label.length + 3
  return {
    from: start,
    to: end,
    insert: `[${label}](https://)`,
    start: url,
    end: url + 'https://'.length,
  }
}

/** `prefix` at the start of every line the selection touches: headings, lists, quotes. */
export function prefixLines(
  text: string,
  start: number,
  end: number,
  prefix: string,
): MarkdownEdit {
  const from = text.lastIndexOf('\n', start - 1) + 1
  const insert = text
    .slice(from, end)
    .split('\n')
    .map((line) => prefix + line)
    .join('\n')
  return { from, to: end, insert, start: from + prefix.length, end: from + insert.length }
}

/** ![name](url) at the cursor, the cursor after it. */
export function image(start: number, end: number, name: string, url: string): MarkdownEdit {
  const insert = `![${name.replace(/[[\]]/g, '')}](${url})`
  return { from: start, to: end, insert, start: start + insert.length, end: start + insert.length }
}

/** A URL pasted over a selection: the selection becomes its text, `![…](url)` for one of the
 *  project's files (`filesUrl` starts their addresses), `[…](url)` for any other address. Null
 *  for anything else (no selection, more than one line, not a single http(s) URL), which pastes as
 *  it is. */
export function pasteUrl(
  text: string,
  start: number,
  end: number,
  pasted: string,
  filesUrl: string,
): MarkdownEdit | null {
  const url = pasted.trim()
  const selected = text.slice(start, end)
  if (!selected.trim() || selected.includes('\n') || !/^https?:\/\/\S+$/i.test(url)) return null
  const insert = `${url.startsWith(filesUrl) ? '!' : ''}[${selected.replace(/[[\]]/g, '')}](${url})`
  return { from: start, to: end, insert, start: start + insert.length, end: start + insert.length }
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// The browser decodes entities in an attribute, so `javascript&#58;` would still run: an address
// passes only with a scheme spelled out at its start, or with no colon and no entity at all.
const SAFE_URL = /^(https?:\/\/|mailto:|[/#?]|[^:&]*$)/i

const preview = new Marked({
  // Raw HTML in an entry shows as text: the preview runs in the owner's session.
  renderer: { html: ({ text }) => escapeHtml(text) },
  walkTokens(token) {
    if ((token.type === 'link' || token.type === 'image') && !SAFE_URL.test(token.href))
      token.href = ''
  },
})

/** The Markdown as HTML for the admin's preview, without raw HTML or script addresses. */
export const renderPreview = (markdown: string) => preview.parse(markdown, { async: false })
