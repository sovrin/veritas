<script setup lang="ts">
import { toast } from '@aequitas/aequitas.js'
import type { Collection, Field } from '#shared/types/cms'
import type { FieldType } from '#shared/utils/fields'
import SidePanel from '~/components/SidePanel.vue'

/** Creates a collection, or edits `collection`: its name and the fields every entry in it has.
 *  A saved field keeps its key and type, so stored values always match what the API promises. */
const props = defineProps<{ project: string; collection?: Collection }>()
const emit = defineEmits<{ dismiss: [] }>()

const creating = !props.collection
type Row = Field & { id: number; saved: boolean; keyTouched: boolean }
let next = 0
const row = (f: Field, saved: boolean): Row => ({ ...f, id: next++, saved, keyTouched: saved })

const name = ref(props.collection?.name ?? '')
const slug = ref(props.collection?.slug ?? '')
const slugTouched = ref(false)
watch(name, (n) => { if (creating && !slugTouched.value) slug.value = slugify(n) })

// A new collection starts with the one field almost every kind of content has.
const rows = ref<Row[]>(props.collection
  ? props.collection.fields.map(f => row(f, true))
  : [row({ key: 'body', label: 'Body', type: 'markdown' }, false)])

const dirty = ref(false)
watch([name, slug, rows], () => { dirty.value = true }, { deep: true })
onMounted(() => {
  nextTick(() => { dirty.value = false })
  if (creating) document.getElementById('collection-name')?.focus()
})

function relabel(r: Row) {
  if (!r.keyTouched) r.key = fieldKey(r.label)
}

const typeMenu = ref<HTMLElement>()
function add(type: FieldType) {
  typeMenu.value?.hidePopover()
  rows.value.push(row({ key: '', label: '', type }, false))
  nextTick(() => document.getElementById(`field-label-${rows.value.at(-1)!.id}`)?.focus())
}

function move(i: number, by: number) {
  const [r] = rows.value.splice(i, 1)
  rows.value.splice(i + by, 0, r!)
}

const error = ref('')
const busy = ref(false)
const base = adminPath(props.project, 'collections')

async function save() {
  error.value = ''
  busy.value = true
  const body = { name: name.value, fields: rows.value.map(({ key, label, type }) => ({ key, label, type })) }
  try {
    const saved = creating
      ? await $fetch<Collection>(base, { method: 'POST', body: { slug: slug.value, ...body } })
      : await $fetch<Collection>(`${base}/${slug.value}`, { method: 'PUT', body })
    await refreshNuxtData(`collections:${props.project}`)
    toast(creating ? `${saved.name} created.` : `${saved.name} saved.`, { tone: 'success' })
    emit('dismiss')
    if (creating) await navigateTo(`/p/${props.project}/${saved.slug}`)
  } catch (e) {
    error.value = problem(e)
  } finally {
    busy.value = false
  }
}

async function remove() {
  const n = props.collection ? (await $fetch(base)).find(c => c.slug === slug.value)?.entries ?? 0 : 0
  if (!confirm(`Delete ${name.value} and its ${n} ${n === 1 ? 'entry' : 'entries'}? This can’t be undone.`)) return
  try {
    await $fetch(`${base}/${slug.value}`, { method: 'DELETE' })
    await refreshNuxtData(`collections:${props.project}`)
    toast(`${name.value} deleted.`, { tone: 'success' })
    emit('dismiss')
    await navigateTo(`/p/${props.project}`)
  } catch (e) {
    error.value = problem(e)
  }
}

function close() {
  if (dirty.value && !confirm('Close without saving? Your changes will be lost.')) return
  emit('dismiss')
}
</script>

<template>
  <SidePanel aria-labelledby="collection-heading" @dismiss="close">
    <form class="panel" @submit.prevent="save">
      <header class="panel-head">
        <div class="panel-title">
          <p class="eyebrow">Collections</p>
          <h2 id="collection-heading" class="truncate">{{ creating ? 'New collection' : collection!.name }}</h2>
        </div>
        <button class="btn" type="button" data-icon data-variant="ghost" data-size="s" aria-label="Close" @click="close">
          <i class="icon" data-icon="x"></i>
        </button>
      </header>

      <div class="panel-body stack gap-5">
        <div class="form-grid">
          <div class="field">
            <label for="collection-name" data-required>Name</label>
            <input id="collection-name" v-model="name" class="input" placeholder="Posts" required />
          </div>
          <div class="field">
            <label for="collection-slug" data-required>Slug</label>
            <input
              id="collection-slug"
              v-model="slug"
              class="input mono"
              placeholder="posts"
              required
              :pattern="SLUG.source"
              :disabled="!creating"
              aria-describedby="collection-slug-hint collection-slug-error"
              @input="slugTouched = true"
            />
            <small id="collection-slug-hint" class="truncate"><span class="mono">/api/v1/{{ project }}/{{ slug || '…' }}</span><template v-if="creating"> · can’t change later</template></small>
            <span id="collection-slug-error" data-error>Use a–z, 0–9 and dashes.</span>
          </div>
        </div>

        <section class="stack gap-2" aria-labelledby="fields-heading">
          <div>
            <h3 id="fields-heading" class="heading">Fields</h3>
            <p class="text-s text-muted">The entry form, top to bottom. The key is the field’s name in the API.</p>
          </div>

          <ol class="field-list" role="list">
            <li class="field-item" data-builtin>
              <i class="icon" data-icon="type" aria-hidden="true"></i>
              <span>Title</span><code>title</code>
              <span class="caption end">Every entry</span>
            </li>
            <li class="field-item" data-builtin>
              <i class="icon" data-icon="link" aria-hidden="true"></i>
              <span>Slug</span><code>slug</code>
              <span class="caption end">Every entry</span>
            </li>
            <li v-for="(r, i) in rows" :key="r.id" class="field-item">
              <i class="icon" :data-icon="FIELD_META[r.type].icon" :title="FIELD_TYPES[r.type]" aria-hidden="true"></i>
              <input
                :id="`field-label-${r.id}`"
                v-model="r.label"
                class="input"
                data-size="s"
                :placeholder="`${FIELD_TYPES[r.type]} field`"
                :aria-label="`${FIELD_TYPES[r.type]} field ${i + 1}: label`"
                required
                @input="relabel(r)"
              />
              <input
                v-model="r.key"
                class="input mono"
                data-size="s"
                placeholder="key"
                :aria-label="`${FIELD_TYPES[r.type]} field ${i + 1}: key`"
                required
                :pattern="FIELD_KEY.source"
                :disabled="r.saved"
                :title="r.saved ? 'Keys are fixed once saved' : undefined"
                @input="r.keyTouched = true"
              />
              <div class="cluster gap-1">
                <button class="btn" type="button" data-icon data-variant="ghost" data-size="s" :disabled="i === 0" :aria-label="`Move ${r.label || 'field'} up`" @click="move(i, -1)">
                  <i class="icon" data-icon="arrow-up"></i>
                </button>
                <button class="btn" type="button" data-icon data-variant="ghost" data-size="s" :disabled="i === rows.length - 1" :aria-label="`Move ${r.label || 'field'} down`" @click="move(i, 1)">
                  <i class="icon" data-icon="arrow-down"></i>
                </button>
                <button class="btn" type="button" data-icon data-variant="ghost" data-size="s" :aria-label="`Remove ${r.label || 'field'}`" @click="rows.splice(i, 1)">
                  <i class="icon" data-icon="x"></i>
                </button>
              </div>
            </li>
          </ol>

          <div>
            <button class="btn" type="button" data-size="s" popovertarget="field-types">
              <i class="icon" data-icon="plus"></i> Add field
            </button>
            <div id="field-types" ref="typeMenu" class="menu" popover>
              <h6>Field type</h6>
              <button v-for="(label, type) in FIELD_TYPES" :key="type" type="button" class="type-option" @click="add(type)">
                <i class="icon" :data-icon="FIELD_META[type].icon"></i>
                <span><b>{{ label }}</b><small>{{ FIELD_META[type].hint }}</small></span>
              </button>
            </div>
          </div>
        </section>

      </div>

      <footer class="panel-foot">
        <button v-if="!creating" class="btn" type="button" data-variant="ghost" data-tone="danger" @click="remove">
          <i class="icon" data-icon="trash"></i> Delete collection
        </button>
        <span v-if="error" class="error-text" role="alert">{{ error }}</span>
        <div class="cluster gap-3 end">
          <button class="btn" type="button" data-variant="ghost" @click="close">Cancel</button>
          <button class="btn" data-variant="primary" type="submit" :aria-busy="busy || undefined">
            {{ creating ? 'Create collection' : 'Save' }}
          </button>
        </div>
      </footer>
    </form>
  </SidePanel>
</template>
