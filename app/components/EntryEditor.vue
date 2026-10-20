<script setup lang="ts">
import { toast } from '@aequitas/aequitas.js'
import type { Collection, Entry } from '#shared/types/cms'
import Segmented from '~/components/ae/Segmented.vue'
import SidePanel from '~/components/SidePanel.vue'

/** Writes a new entry, or edits `entry`, in a panel over the collection's table. The form follows the collection's fields;
 *  the API tab shows what the delivery API returns for it, since a headless CMS has no page to preview. */
const props = defineProps<{ project: string; collection: Collection; entry?: Entry }>()

const creating = !props.entry
const base = adminPath(props.project, 'collections', props.collection.slug, 'entries')
const listPath = `/p/${props.project}/${props.collection.slug}`

const title = ref(props.entry?.title ?? '')
const slug = ref(props.entry?.slug ?? '')
const published = ref(props.entry?.published ?? false)
const savedAt = ref(props.entry?.updatedAt)
// A stored value that no longer fits its field starts empty rather than failing the save.
const values = reactive(Object.fromEntries(props.collection.fields.map((f) => {
  const v = coerce(f.type, props.entry?.fields[f.key])
  return [f.key, v === undefined ? emptyValue(f.type) : v]
})))

// The slug follows the title until someone edits it.
const slugTouched = ref(false)
watch(title, (t) => { if (creating && !slugTouched.value) slug.value = slugify(t) })

const tab = ref<'form' | 'api'>('form')
const TABS = [{ value: 'form', label: 'Content' }, { value: 'api', label: 'API preview' }] as const
const delivered = computed(() => ({ slug: slug.value, title: title.value, ...values, updatedAt: savedAt.value ?? null }))

const dirty = ref(false)
watch([title, slug, published, values], () => { dirty.value = true }, { deep: true })

const error = ref('')
const busy = ref(false)
const refreshLists = () => refreshNuxtData([`entries:${props.project}:${props.collection.slug}`, `collections:${props.project}`])

async function save() {
  if (busy.value) return
  error.value = ''
  busy.value = true
  const body = { title: title.value, fields: values, published: published.value }
  try {
    if (creating) {
      const saved = await $fetch<Entry>(base, { method: 'POST', body: { slug: slug.value, ...body } })
      await refreshLists()
      toast(saved.published ? 'Published.' : 'Saved as draft.', { tone: 'success' })
      await navigateTo(`${listPath}/${saved.slug}`, { replace: true })
    } else {
      const saved = await $fetch<Entry>(`${base}/${slug.value}`, { method: 'PUT', body })
      savedAt.value = saved.updatedAt
      await nextTick()
      dirty.value = false
      await refreshLists()
      toast('Saved.', { tone: 'success' })
    }
  } catch (e) {
    error.value = problem(e)
  } finally {
    busy.value = false
  }
}

async function remove() {
  if (!confirm(`Delete “${title.value}”? This can’t be undone.`)) return
  try {
    await $fetch(`${base}/${slug.value}`, { method: 'DELETE' })
    await refreshLists()
    toast(`“${title.value}” deleted.`, { tone: 'success' })
    await navigateTo(listPath)
  } catch (e) {
    error.value = problem(e)
  }
}

function close() {
  if (dirty.value && !confirm('Close without saving? Your changes will be lost.')) return
  navigateTo(listPath)
}

onMounted(() => {
  nextTick(() => { dirty.value = false })
  if (creating) document.getElementById('entry-title')?.focus()
})
</script>

<template>
  <SidePanel aria-labelledby="entry-heading" @dismiss="close">
    <form class="panel" @submit.prevent="save" @keydown.meta.enter.prevent="save" @keydown.ctrl.enter.prevent="save">
      <header class="panel-head">
        <div class="panel-title">
          <p class="eyebrow">{{ collection.name }}</p>
          <h2 id="entry-heading" class="truncate">{{ creating ? 'New entry' : title || slug }}</h2>
        </div>
        <span class="badge" data-dot :data-tone="published ? 'success' : undefined">{{ published ? 'Published' : 'Draft' }}</span>
        <button class="btn" type="button" data-icon data-variant="ghost" data-size="s" aria-label="Close" @click="close">
          <i class="icon" data-icon="x"></i>
        </button>
      </header>

      <div class="panel-tabs">
        <Segmented v-model="tab" :options="TABS" label="View" />
      </div>

      <div v-show="tab === 'form'" class="panel-body stack gap-4">
        <div class="field">
          <label for="entry-title" data-required>Title</label>
          <input id="entry-title" v-model="title" class="input" required />
        </div>
        <div class="field">
          <label for="entry-slug" data-required>Slug</label>
          <input
            id="entry-slug"
            v-model="slug"
            class="input mono"
            required
            :pattern="SLUG.source"
            :disabled="!creating"
            aria-describedby="entry-slug-hint entry-slug-error"
            @input="slugTouched = true"
          />
          <small id="entry-slug-hint" class="truncate"><span class="mono">/api/v1/{{ project }}/{{ collection.slug }}/{{ slug || '…' }}</span><template v-if="creating"> · can’t change later</template></small>
          <span id="entry-slug-error" data-error>Use a–z, 0–9 and dashes.</span>
        </div>

        <div v-for="f in collection.fields" :key="f.key" class="field">
          <template v-if="f.type === 'boolean'">
            <label><input :id="`f-${f.key}`" v-model="values[f.key]" type="checkbox" role="switch" /> {{ f.label }}</label>
          </template>
          <template v-else>
            <label :for="`f-${f.key}`">{{ f.label }}</label>
            <textarea v-if="f.type === 'markdown'" :id="`f-${f.key}`" v-model="values[f.key] as string" class="input entry-markdown" />
            <input v-else-if="f.type === 'number'" :id="`f-${f.key}`" v-model.number="values[f.key]" class="input entry-short" type="number" step="any" />
            <input v-else-if="f.type === 'date'" :id="`f-${f.key}`" v-model="values[f.key]" class="input entry-short" type="date" />
            <input v-else :id="`f-${f.key}`" v-model="values[f.key]" class="input" />
          </template>
        </div>

        <p v-if="!collection.fields.length" class="text-s text-muted">{{ collection.name }} has no fields besides title and slug.</p>
      </div>

      <div v-show="tab === 'api'" class="panel-body stack gap-3">
        <p class="text-s text-muted">
          {{ published
            ? (dirty ? 'The API returns this once you save.' : 'The API returns this for the entry.')
            : 'Drafts aren’t delivered. Publish the entry and the API returns this.' }}
        </p>
        <figure class="code">
          <figcaption>GET /api/v1/{{ project }}/{{ collection.slug }}/{{ slug || '…' }}</figcaption>
          <!-- eslint-disable-next-line vue/no-v-html -- escaped before it is marked up -->
          <pre tabindex="0"><code v-html="highlightJson(delivered)"></code></pre>
        </figure>
      </div>

      <footer class="panel-foot">
        <button v-if="!creating" class="btn" type="button" data-variant="ghost" data-tone="danger" @click="remove">
          <i class="icon" data-icon="trash"></i> Delete entry
        </button>
        <label class="text-s"><input v-model="published" type="checkbox" role="switch" /> Published</label>
        <span v-if="error" class="error-text" role="alert">{{ error }}</span>
        <span v-else class="caption" role="status">{{ dirty ? 'Unsaved changes' : savedAt ? `Saved ${long(savedAt)}` : '' }}</span>
        <div class="cluster gap-3 end">
          <button class="btn" type="button" data-variant="ghost" @click="close">Cancel</button>
          <button class="btn" data-variant="primary" type="submit" :aria-busy="busy || undefined">
            {{ creating ? (published ? 'Publish' : 'Save draft') : 'Save' }}
          </button>
        </div>
      </footer>
    </form>
  </SidePanel>
</template>
