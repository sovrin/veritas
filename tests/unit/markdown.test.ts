import { describe, expect, it } from 'vitest'
import { image, link, prefixLines, renderPreview, wrap } from '../../app/lib/markdown'

const apply = (text: string, edit: ReturnType<typeof wrap>) => {
  const after = text.slice(0, edit.from) + edit.insert + text.slice(edit.to)
  return { after, selected: after.slice(edit.start, edit.end) }
}

describe('markdown toolbar', () => {
  it('wraps the selection, or puts the cursor between the marks', () => {
    expect(apply('a word here', wrap('a word here', 2, 6, '**'))).toEqual({
      after: 'a **word** here',
      selected: 'word',
    })
    const empty = wrap('ab', 1, 1, '_')
    expect(apply('ab', empty).after).toBe('a__b')
    expect(empty.start).toBe(2)
  })

  it('links the selection and selects the address', () => {
    expect(apply('see docs', link('see docs', 4, 8))).toEqual({
      after: 'see [docs](https://)',
      selected: 'https://',
    })
  })

  it('prefixes every line the selection touches', () => {
    const text = 'one\ntwo\nthree'
    expect(apply(text, prefixLines(text, 1, 6, '- ')).after).toBe('- one\n- two\nthree')
    expect(apply(text, prefixLines(text, 9, 9, '## ')).after).toBe('one\ntwo\n## three')
  })

  it('inserts an image at the cursor', () => {
    expect(apply('ab', image(1, 1, 'shot [1].png', 'https://x/f')).after).toBe(
      'a![shot 1.png](https://x/f)b',
    )
  })
})

describe('markdown preview', () => {
  it('renders Markdown', () => {
    expect(renderPreview('**hi** [a](https://x.y)')).toBe(
      '<p><strong>hi</strong> <a href="https://x.y">a</a></p>\n',
    )
  })

  it('shows raw HTML as text', () => {
    const html = renderPreview('<img src=x onerror=alert(1)>\n\nhi <b onclick=x>b</b>')
    expect(html).not.toMatch(/<img|<b /)
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })

  it('drops script addresses, however they are spelled', () => {
    for (const markdown of [
      '[a](javascript:alert(1))',
      '[a](javascript&#58;alert(1))',
      '[a][r]\n\n[r]: javascript&colon;x',
      '![i](data:image/svg+xml,x)',
    ])
      expect(renderPreview(markdown)).not.toMatch(/(href|src)="[^"]/)
    expect(renderPreview('[a](/posts/b) [c](#d) [e](mailto:e@f.g)')).toContain('href="/posts/b"')
  })
})
