<script setup lang="ts">
import { errorMessage } from '#nexitas/app/lib/format'
import type { Collection, Entry } from '../../shared/contracts'
import { coerce, deliver, emptyValue, slugify } from '../../shared/contracts'
import { deliveryPath } from '../lib/fields'

/** Writes a new entry, or edits `entry`. The form follows the collection's fields; below it stands
 *  what the API delivers for it, since a headless CMS has no page to preview. */
const props = defineProps<{ projectId: string; collection: Collection; entry?: Entry }>()
const emit = defineEmits<{ saved: [Entry] }>()

const title = ref(props.entry?.title ?? '')
const slug = ref(props.entry?.slug ?? '')
const slugTouched = ref(!!props.entry)
// A new entry's slug follows its title until it is edited by hand.
watch(title, (value) => {
  if (!slugTouched.value) slug.value = slugify(value)
})
const published = ref(props.entry?.published ?? false)
// A stored value that no longer fits its field starts empty rather than failing the save.
const values = reactive<Record<string, unknown>>(
  Object.fromEntries(
    props.collection.fields.map((field) => {
      const value = coerce(field.type, props.entry?.fields[field.key])
      return [field.key, value === undefined ? emptyValue(field.type) : value]
    }),
  ),
)
const delivered = computed(() =>
  JSON.stringify(
    deliver(
      {
        slug: slug.value,
        title: title.value,
        fields: values,
        published: published.value,
        updatedAt: props.entry?.updatedAt ?? Date.now(),
      },
      props.collection,
    ),
    null,
    2,
  ),
)

const pending = ref(false)
const error = ref('')
const issues = ref<{ path: string; message: string }[]>([])
const fieldError = (path: string) => issues.value.find((issue) => issue.path === path)?.message

async function save() {
  pending.value = true
  error.value = ''
  issues.value = []
  const body = { title: title.value, fields: values, published: published.value }
  const base = `/api/content/${props.projectId}/collections/${props.collection.slug}/entries`
  try {
    const saved = await $fetch<Entry>(props.entry ? `${base}/${props.entry.slug}` : base, {
      method: 'POST',
      body: props.entry ? body : { ...body, slug: slug.value },
    })
    emit('saved', saved)
  } catch (cause) {
    const data = (cause as { data?: { data?: { issues?: typeof issues.value } } }).data?.data
    if (data?.issues?.length) issues.value = data.issues
    else error.value = errorMessage(cause)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <form class="stack gap-5" @submit.prevent="save">
    <fieldset :disabled="pending" class="stack gap-4">
      <div class="field">
        <label for="title">Title</label>
        <input
          id="title"
          v-model="title"
          class="input"
          required
          maxlength="200"
          :aria-invalid="!!fieldError('title') || undefined"
        />
        <span v-if="fieldError('title')" data-error>{{ fieldError('title') }}</span>
      </div>
      <div class="field">
        <label for="slug">Slug</label>
        <input
          id="slug"
          v-model="slug"
          class="input font-mono text-s"
          required
          maxlength="64"
          autocomplete="off"
          spellcheck="false"
          :readonly="!!entry"
          :aria-invalid="!!fieldError('slug') || undefined"
          aria-describedby="slug-help"
          @input="slugTouched = true"
        />
        <small id="slug-help"
          ><span class="font-mono">{{ deliveryPath(projectId, collection.slug, slug || '…') }}</span
          >{{ entry ? '' : ' · cannot change later' }}</small
        >
        <span v-if="fieldError('slug')" data-error>{{ fieldError('slug') }}</span>
      </div>

      <div v-for="field in collection.fields" :key="field.key" class="field">
        <label v-if="field.type === 'boolean'"
          ><input v-model="values[field.key]" type="checkbox" role="switch" />
          {{ field.label }}</label
        >
        <template v-else>
          <label :for="`field-${field.key}`">{{ field.label }}</label>
          <textarea
            v-if="field.type === 'markdown'"
            :id="`field-${field.key}`"
            v-model="values[field.key] as string"
            class="input font-mono text-s"
            rows="10"
          ></textarea>
          <input
            v-else-if="field.type === 'number'"
            :id="`field-${field.key}`"
            v-model.number="values[field.key]"
            class="input"
            type="number"
            step="any"
          />
          <input
            v-else-if="field.type === 'date'"
            :id="`field-${field.key}`"
            v-model="values[field.key]"
            class="input"
            type="date"
          />
          <input v-else :id="`field-${field.key}`" v-model="values[field.key]" class="input" />
        </template>
        <span v-if="fieldError(`fields.${field.key}`)" data-error>{{
          fieldError(`fields.${field.key}`)
        }}</span>
      </div>
      <p v-if="!collection.fields.length" class="text-s text-muted">
        {{ collection.name }} has no fields besides the title and slug.
      </p>

      <label><input v-model="published" type="checkbox" role="switch" /> Published</label>
    </fieldset>

    <div v-if="issues.length || error" class="alert" data-tone="danger" role="alert">
      <div>
        <template v-if="error"><strong>Could not save the entry.</strong> {{ error }}</template>
        <template v-else>
          <strong>Check these fields.</strong>
          <ul>
            <li v-for="issue in issues" :key="issue.path">
              <span class="font-mono">{{ issue.path }}</span
              >: {{ issue.message }}
            </li>
          </ul>
        </template>
      </div>
    </div>

    <div class="cluster gap-3 hairline-t pt-5">
      <p class="caption">
        {{ published ? 'The API delivers it once saved.' : 'A draft: the API leaves it out.' }}
      </p>
      <button
        type="submit"
        class="btn end"
        data-size="s"
        data-variant="primary"
        :disabled="pending"
        :aria-busy="pending || undefined"
      >
        {{ entry ? 'Save changes' : published ? 'Publish' : 'Save draft' }}
      </button>
    </div>

    <section class="stack gap-2" aria-labelledby="delivered-title">
      <h2 id="delivered-title" class="text-s weight-600">As the API delivers it</h2>
      <pre class="snippet font-mono text-xs"><code>{{ delivered }}</code></pre>
    </section>
  </form>
</template>
