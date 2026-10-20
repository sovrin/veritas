const time = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })
const day = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })
const full = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/** "14:32" for today, "6 Oct" before that: enough to tell entries apart in a list. */
export function short(iso: string): string {
  const d = new Date(iso)
  return d.toDateString() === new Date().toDateString() ? time.format(d) : day.format(d)
}

export const long = (iso: string) => full.format(new Date(iso))

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' }
const TOKEN = /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g

/** Pretty JSON as HTML, with keys, strings, numbers and literals in spans. Escapes before it marks up. */
export function highlightJson(value: unknown): string {
  return JSON.stringify(value, null, 2)
    .replace(/[&<>]/g, c => ESCAPES[c]!)
    .replace(TOKEN, (m, _s, colon) => {
      const kind = colon ? 'key' : m.startsWith('"') ? 'string' : /true|false|null/.test(m) ? 'literal' : 'number'
      return `<span class="json-${kind}">${m}</span>`
    })
}
