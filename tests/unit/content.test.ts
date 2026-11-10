import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { DatabaseSync } from 'node:sqlite'
import { afterEach, describe, expect, it } from 'vitest'
import { openDatabase } from '#nexitas/server/core/database'
import { createProject, deleteProject } from '#nexitas/server/core/projects'
import {
  collectionSettingsSchema,
  deliver,
  fieldKey,
  newCollectionSchema,
  readFields,
  selectFields,
  slugify,
  splitList,
  type Collection,
} from '#self/shared/contracts'
import {
  changedTypes,
  createCollection,
  createEntry,
  createSpace,
  deleteEntry,
  getCollection,
  getEntry,
  getSpace,
  listCollections,
  listEntries,
  rotateToken,
  updateCollection,
  updateEntry,
} from '#self/server/core/content'
import { veritas } from '#self/server/core/module'

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
  return db
}

const posts: Collection = {
  slug: 'posts',
  name: 'Posts',
  fields: [
    { key: 'body', label: 'Body', type: 'markdown' },
    { key: 'publishedOn', label: 'Published on', type: 'date' },
    { key: 'featured', label: 'Featured', type: 'boolean' },
  ],
}

describe('content', () => {
  it('delivers only the fields a list asks for, the slug always, and names the unknown ones', () => {
    const entry = {
      slug: 'hello',
      title: 'Hello',
      fields: { body: '# Hi', publishedOn: '2026-10-21', featured: true },
      published: true,
      updatedAt: 0,
    }
    const { only, unknown } = selectFields('title, publishedOn,,', posts)
    expect(unknown).toEqual([])
    expect(deliver(entry, posts, undefined, only)).toEqual({
      slug: 'hello',
      title: 'Hello',
      publishedOn: '2026-10-21',
    })
    expect(selectFields('', posts).only).toBeNull()
    expect(selectFields('title,tilte', posts).unknown).toEqual(['tilte'])
  })

  it('stores a list as trimmed strings, each once, and refuses anything else', () => {
    const tagged = { fields: [{ key: 'tags', label: 'Tags', type: 'list' as const }] }
    expect(readFields(tagged, { tags: splitList(' vue, ,news,vue ') })).toEqual({
      fields: { tags: ['vue', 'news'] },
    })
    expect(readFields(tagged, {})).toEqual({ fields: { tags: [] } })
    expect(readFields(tagged, { tags: 'vue' })).toHaveProperty('issues')
    expect(readFields(tagged, { tags: ['vue', 1] })).toHaveProperty('issues')
  })

  it('starts once per project, with a token that can be replaced', () => {
    const db = database()
    expect(createSpace(db, 'sonotas')).toBe(true)
    expect(createSpace(db, 'sonotas')).toBe(false)
    const token = getSpace(db, 'sonotas')!.token
    expect(token).toMatch(/^vt_/)
    rotateToken(db, 'sonotas')
    expect(getSpace(db, 'sonotas')!.token).not.toBe(token)
  })

  it('delivers only published entries, flat, with the fields the collection has now', () => {
    const db = database()
    createSpace(db, 'sonotas')
    expect(createCollection(db, 'sonotas', posts)).toBe(true)
    createEntry(db, 'sonotas', 'posts', {
      slug: 'hello',
      title: 'Hello',
      fields: { body: '# Hi', publishedOn: '2026-10-21', featured: true, gone: 'x' },
      published: true,
    })
    createEntry(db, 'sonotas', 'posts', {
      slug: 'draft',
      title: 'Draft',
      fields: {},
      published: false,
    })
    const delivered = listEntries(db, 'sonotas', 'posts', true).map((entry) =>
      deliver(entry, posts),
    )
    expect(delivered).toEqual([
      {
        slug: 'hello',
        title: 'Hello',
        body: '# Hi',
        publishedOn: '2026-10-21',
        featured: true,
        updatedAt: expect.any(String),
      },
    ])
    expect(listCollections(db, 'sonotas')).toEqual([
      { ...posts, entries: 2, published: 1, updatedAt: expect.any(Number) },
    ])
    updateEntry(db, 'sonotas', 'posts', {
      slug: 'draft',
      title: 'Now out',
      fields: {},
      published: true,
    })
    expect(
      listEntries(db, 'sonotas', 'posts', true)
        .map((entry) => entry.slug)
        .sort(),
    ).toEqual(['draft', 'hello'])
  })

  it("drops a removed field's values, so a field added again under its key starts empty", () => {
    const db = database()
    createSpace(db, 'sonotas')
    createCollection(db, 'sonotas', posts)
    createEntry(db, 'sonotas', 'posts', {
      slug: 'a',
      title: 'A',
      fields: { body: 'abc', featured: true },
      published: true,
    })
    updateCollection(db, 'sonotas', 'posts', { name: 'Posts', fields: posts.fields.slice(2) })
    expect(getEntry(db, 'sonotas', 'posts', 'a')!.fields).toEqual({ featured: true })
    const again = {
      name: 'Posts',
      fields: [...posts.fields.slice(2), { key: 'body', label: 'Body', type: 'number' as const }],
    }
    expect(changedTypes(getCollection(db, 'sonotas', 'posts')!, again)).toEqual([])
    updateCollection(db, 'sonotas', 'posts', again)
    expect(getEntry(db, 'sonotas', 'posts', 'a')!.fields).toEqual({ featured: true })
  })

  it("does not find another project's collections and entries", () => {
    const db = database()
    createProject(db, { id: 'other', name: 'other', origins: [] })
    createSpace(db, 'sonotas')
    createSpace(db, 'other')
    createCollection(db, 'sonotas', posts)
    createEntry(db, 'sonotas', 'posts', { slug: 'a', title: 'A', fields: {}, published: true })
    expect(getCollection(db, 'other', 'posts')).toBeNull()
    expect(getEntry(db, 'other', 'posts', 'a')).toBeNull()
    deleteEntry(db, 'other', 'posts', 'a')
    expect(getEntry(db, 'sonotas', 'posts', 'a')).not.toBeNull()
  })

  it('goes with its project, collections and entries included', () => {
    const db = database()
    createSpace(db, 'sonotas')
    createCollection(db, 'sonotas', posts)
    createEntry(db, 'sonotas', 'posts', { slug: 'a', title: 'A', fields: {}, published: true })
    deleteProject(db, 'sonotas', [veritas])
    expect(db.prepare('SELECT COUNT(*) AS n FROM entries').get()).toEqual({ n: 0 })
    expect(getSpace(db, 'sonotas')).toBeNull()
  })
})

describe('rules', () => {
  it('check values against the collection, and drop keys it does not define', () => {
    expect(readFields(posts, { body: 'x', featured: 'yes', publishedOn: '21.10.2026' })).toEqual({
      issues: [
        { path: 'fields.publishedOn', message: 'Enter a date.' },
        { path: 'fields.featured', message: 'Enter on or off.' },
      ],
    })
    expect(readFields(posts, { body: 'x', extra: 1 })).toEqual({
      fields: { body: 'x', publishedOn: '', featured: false },
    })
  })

  it('keep keys usable in code, unique and clear of the built-in ones', () => {
    const field = { key: 'body', label: 'Body', type: 'text' }
    expect(
      newCollectionSchema.safeParse({ slug: 'posts', name: 'Posts', fields: [field] }).success,
    ).toBe(true)
    for (const fields of [
      [field, field],
      [{ ...field, key: 'title' }],
      [{ ...field, key: 'Body' }],
    ])
      expect(collectionSettingsSchema.safeParse({ name: 'Posts', fields }).success).toBe(false)
    expect(
      newCollectionSchema.safeParse({ slug: '-posts', name: 'Posts', fields: [] }).success,
    ).toBe(false)
  })

  it("keep a saved field's type, and make slugs and keys from names", () => {
    expect(
      changedTypes(posts, {
        name: 'Posts',
        fields: [{ key: 'body', label: 'Body', type: 'text' }],
      }),
    ).toHaveLength(1)
    expect(changedTypes(posts, { name: 'Posts', fields: [] })).toEqual([])
    expect(slugify('Hello, Wörld!')).toBe('hello-world')
    expect(fieldKey('Hero image')).toBe('heroImage')
  })

  it('store a file field as an id, and deliver the file it finds, or null', () => {
    const team: Collection = {
      slug: 'team',
      name: 'Team',
      fields: [
        { key: 'photo', label: 'Photo', type: 'image' },
        { key: 'cv', label: 'CV', type: 'file' },
      ],
    }
    expect(readFields(team, { photo: 'abc_123', cv: '' })).toEqual({
      fields: { photo: 'abc_123', cv: null },
    })
    expect(readFields(team, { photo: '../etc/passwd' })).toEqual({
      issues: [{ path: 'fields.photo', message: 'Enter an image.' }],
    })
    const entry = {
      slug: 'ada',
      title: 'Ada',
      fields: { photo: 'abc_123', cv: 'gone' },
      published: true,
      updatedAt: 0,
    }
    const photo = {
      url: 'https://x/v1/files/p/abc_123',
      name: 'ada.png',
      type: 'image/png',
      size: 9,
      width: 2,
      height: 1,
    }
    expect(deliver(entry, team, (id) => (id === 'abc_123' ? photo : null))).toMatchObject({
      photo,
      cv: null,
    })
    // Nothing provides files: the fields stay, empty.
    expect(deliver(entry, team)).toMatchObject({ photo: null, cv: null })
  })
})
