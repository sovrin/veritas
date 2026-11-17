import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { DatabaseSync } from 'node:sqlite'
import { afterEach, describe, expect, it } from 'vitest'
import { openDatabase } from '#nexitas/server/core/database'
import { createProject } from '#nexitas/server/core/projects'
import { answerMessage } from '#nexitas/server/utils/mcp'
import {
  createSpace,
  getCollection,
  getEntry,
  getSpace,
  setMcpAccess,
  updateEntry,
} from '#self/server/core/content'
import { veritas } from '#self/server/core/module'
import { contentTools, instructions } from '#self/server/core/tools'

const dirs: string[] = []
const dbs: DatabaseSync[] = []
afterEach(() => {
  for (const db of dbs.splice(0)) if (db.isOpen) db.close()
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function database() {
  const dir = mkdtempSync(join(tmpdir(), 'veritas-test-'))
  dirs.push(dir)
  const db = openDatabase(join(dir, 'test.sqlite'), [veritas])
  dbs.push(db)
  createProject(db, { id: 'sonotas', name: 'sonotas', origins: ['https://sonotas.example'] })
  createSpace(db, 'sonotas')
  return db
}

function server(db: DatabaseSync) {
  let changes = 0
  const mcp = {
    name: 'veritas',
    instructions,
    tools: contentTools(db, 'sonotas', {}, () => changes++),
  }
  let id = 0
  const call = (name: string, args: unknown) => {
    const answer = answerMessage(
      { jsonrpc: '2.0', id: ++id, method: 'tools/call', params: { name, arguments: args } },
      mcp,
    ) as { result: { content: { text: string }[]; isError: boolean } }
    const { text } = answer.result.content[0]!
    return answer.result.isError ? { error: text } : JSON.parse(text)
  }
  return { mcp, call, changes: () => changes }
}

const posts = {
  slug: 'posts',
  name: 'Posts',
  fields: [
    { key: 'body', label: 'Body', type: 'markdown' },
    { key: 'tags', label: 'Tags', type: 'list' },
  ],
}

describe('mcp', () => {
  it('lists its tools, each with an object schema', () => {
    const { mcp } = server(database())
    const listed = answerMessage({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, mcp) as {
      result: { tools: { name: string; inputSchema: { type: string } }[] }
    }
    expect(listed.result.tools.map((tool) => tool.name)).toEqual([
      'list_collections',
      'list_entries',
      'get_entry',
      'create_collection',
      'update_collection',
      'save_entries',
      'delete_entries',
    ])
    expect(listed.result.tools.every((tool) => tool.inputSchema.type === 'object')).toBe(true)
  })

  it('makes collections, and refuses a taken slug, a reserved key and a field without files', () => {
    const db = database()
    const { call, changes } = server(db)
    expect(call('create_collection', posts)).toEqual(posts)
    expect(call('list_collections', {})).toMatchObject([{ slug: 'posts', entries: 0 }])
    expect(call('create_collection', posts).error).toMatch(/already/)
    expect(
      call('create_collection', {
        slug: 'pages',
        name: 'Pages',
        fields: [{ key: 'title', label: 'T', type: 'text' }],
      }).error,
    ).toBeDefined()
    expect(
      call('create_collection', {
        slug: 'pages',
        name: 'Pages',
        fields: [{ key: 'hero', label: 'Hero', type: 'image' }],
      }).error,
    ).toMatch(/provides files/)
    expect(changes()).toBe(1)
  })

  it('changes a collection, keeping each field its type, and names the fields it removed', () => {
    const db = database()
    const { call } = server(db)
    call('create_collection', posts)
    expect(
      call('update_collection', {
        collection: 'posts',
        name: 'Posts',
        fields: [{ key: 'body', label: 'Body', type: 'text' }],
      }).error,
    ).toMatch(/body keep their type/)
    expect(
      call('update_collection', {
        collection: 'posts',
        name: 'Articles',
        fields: [{ key: 'body', label: 'Text', type: 'markdown' }],
      }),
    ).toMatchObject({ name: 'Articles', removed: ['tags'] })
    expect(getCollection(db, 'sonotas', 'posts')!.fields).toHaveLength(1)
  })

  it('writes entries as drafts, keeps what an update leaves out, and saves all or none', () => {
    const db = database()
    const { call, changes } = server(db)
    call('create_collection', posts)
    expect(
      call('save_entries', {
        collection: 'posts',
        entries: [{ slug: 'hello', title: 'Hello', fields: { body: '# Hi', tags: ['a'] } }],
      }),
    ).toEqual([{ slug: 'hello', saved: 'created', published: false }])
    const hello = getEntry(db, 'sonotas', 'posts', 'hello')!
    updateEntry(db, 'sonotas', 'posts', { ...hello, published: true })
    expect(
      call('save_entries', {
        collection: 'posts',
        entries: [{ slug: 'hello', fields: { tags: ['b'] } }],
      }),
    ).toEqual([{ slug: 'hello', saved: 'updated', published: true }])
    expect(getEntry(db, 'sonotas', 'posts', 'hello')).toMatchObject({
      title: 'Hello',
      fields: { body: '# Hi', tags: ['b'] },
      published: true,
    })
    expect(
      call('save_entries', {
        collection: 'posts',
        entries: [
          { slug: 'ok', title: 'OK' },
          { slug: 'bad', title: 'Bad', fields: { tags: 'nope' } },
        ],
      }).error,
    ).toMatch(/bad: fields\.tags/)
    expect(call('save_entries', { collection: 'posts', entries: [{ slug: 'x' }] }).error).toMatch(
      /needs a title/,
    )
    expect(getEntry(db, 'sonotas', 'posts', 'ok')).toBeNull()
    expect(call('save_entries', { collection: 'nope', entries: [{ slug: 'x' }] }).error).toMatch(
      /no collection nope/,
    )
    expect(changes()).toBe(3)
  })

  it('enumerates and reads entries, and deletes them', () => {
    const db = database()
    const { call } = server(db)
    call('create_collection', posts)
    call('save_entries', {
      collection: 'posts',
      entries: [
        { slug: 'a', title: 'A' },
        { slug: 'b', title: 'B', fields: { body: 'b' } },
      ],
    })
    expect(call('list_entries', { collection: 'posts' }).entries).toHaveLength(2)
    expect(call('list_entries', { collection: 'posts', state: 'published' }).entries).toEqual([])
    expect(
      call('list_entries', { collection: 'posts', fields: true }).entries.find(
        (entry: { slug: string }) => entry.slug === 'b',
      ).fields,
    ).toEqual({ body: 'b', tags: [] })
    expect(call('get_entry', { collection: 'posts', slug: 'b' })).toMatchObject({ title: 'B' })
    expect(call('get_entry', { collection: 'posts', slug: 'z' }).error).toMatch(/no entry z/)
    expect(call('delete_entries', { collection: 'posts', slugs: ['a', 'z'] })).toEqual({
      deleted: ['a'],
      notFound: ['z'],
    })
  })

  it('has no token until the owner turns access on, and a new one each time', () => {
    const db = database()
    expect(getSpace(db, 'sonotas')!.mcpToken).toBeNull()
    setMcpAccess(db, 'sonotas', true)
    const first = getSpace(db, 'sonotas')!.mcpToken
    expect(first).toMatch(/^vtm_/)
    setMcpAccess(db, 'sonotas', true)
    expect(getSpace(db, 'sonotas')!.mcpToken).not.toBe(first)
    setMcpAccess(db, 'sonotas', false)
    expect(getSpace(db, 'sonotas')!.mcpToken).toBeNull()
  })
})
