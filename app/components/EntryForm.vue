<script setup lang="ts">
import type { StoredFile } from '#nexitas/shared/capabilities'
import type { Collection, Entry } from '../../shared/contracts'
import {
  FIELD_NEEDS,
  coerce,
  deliver,
  deliveredFile,
  emptyValue,
  slugify,
  splitList,
} from '../../shared/contracts'
import { deliveryPath } from '../lib/fields'

/** Writes a new entry, or edits `entry`. The form follows the collection's fields; under it stands
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
// A list is typed as text, so a trailing comma or space survives until the next value.
const listText = reactive<Record<string, string>>(
  Object.fromEntries(
    props.collection.fields
      .filter((field) => field.type === 'list')
      .map((field) => [field.key, (values[field.key] as string[]).join(', ')]),
  ),
)
// File fields use whichever module provides files: its picker, and the files it picked, for the
// preview below.
const filesOn = useCapability('files')
const origin = useRequestURL().origin
const picked = reactive<Record<string, StoredFile>>({})
const pick = (file: StoredFile | null) => {
  if (file) picked[file.id] = file
}
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
      (id) => (picked[id] ? deliveredFile(origin, picked[id]) : null),
    ),
    null,
    2,
  ),
)

const { pending, error, issues, fieldError, submit } = useSubmit()

// Which state the save in progress leaves the entry in, for the button that started it.
const saving = ref<boolean | null>(null)
async function save(publish = published.value) {
  saving.value = publish
  const body = { title: title.value, fields: values, published: publish }
  const base = `/api/p/${props.projectId}/content/collections/${props.collection.slug}/entries`
  const saved = await submit(() =>
    $fetch<Entry>(props.entry ? `${base}/${props.entry.slug}` : base, {
      method: 'POST',
      body: props.entry ? body : { ...body, slug: slug.value },
    }),
  )
  saving.value = null
  if (!saved) return
  published.value = saved.published
  emit('saved', saved)
}
// Publish and Unpublish change the state, so only a click does it: Enter in a field submits, and
// keeps it. They check the form as a submit would.
const form = useTemplateRef<HTMLFormElement>('form')
function saveAs(publish: boolean) {
  if (form.value?.reportValidity()) save(publish)
}
</script>

<template>
  <!-- The preview lives here, not in the page, so it follows the form's values as they are typed. -->
  <div class="stack gap-5">
    <form ref="form" class="stack gap-5 min-w-0" @submit.prevent="save()">
      <fieldset :disabled="pending" class="stack gap-4">
        <div class="field">
          <label for="title">Title</label>
          <input
            id="title"
            v-model="title"
            data-size="s"
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
            data-size="s"
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
            ><span class="font-mono">{{
              deliveryPath(projectId, collection.slug, slug || '…')
            }}</span
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
            <MarkdownField
              v-if="field.type === 'markdown'"
              :id="`field-${field.key}`"
              v-model="values[field.key] as string"
            />
            <template v-else-if="FIELD_NEEDS[field.type] === 'files'">
              <component
                :is="'FilesPicker'"
                v-if="filesOn"
                :id="`field-${field.key}`"
                v-model="values[field.key]"
                :accept="field.type === 'image' ? 'image' : undefined"
                @picked="pick"
              />
              <small v-else class="text-muted"
                >Needs a module that provides files. Until one is on, the entry keeps what it has
                here.</small
              >
            </template>
            <template v-else-if="field.type === 'list'">
              <input
                :id="`field-${field.key}`"
                v-model="listText[field.key]"
                data-size="s"
                class="input"
                autocomplete="off"
                :aria-describedby="`field-${field.key}-help`"
                @input="values[field.key] = splitList(listText[field.key] ?? '')"
              />
              <small :id="`field-${field.key}-help`">Separate values with commas</small>
            </template>
            <input
              v-else-if="field.type === 'number'"
              :id="`field-${field.key}`"
              v-model.number="values[field.key]"
              data-size="s"
              class="input"
              type="number"
              step="any"
            />
            <input
              v-else-if="field.type === 'date'"
              :id="`field-${field.key}`"
              v-model="values[field.key]"
              data-size="s"
              class="input"
              type="date"
            />
            <input
              v-else
              :id="`field-${field.key}`"
              v-model="values[field.key]"
              data-size="s"
              class="input"
            />
          </template>
          <span v-if="fieldError(`fields.${field.key}`)" data-error>{{
            fieldError(`fields.${field.key}`)
          }}</span>
        </div>
        <p v-if="!collection.fields.length" class="text-s text-muted">
          {{ collection.name }} has no fields besides the title and slug.
        </p>
      </fieldset>

      <FormIssues :error="error" :issues="issues" failed="Could not save the entry." />

      <!-- A draft's primary is Publish; a published entry's is Save, beside Unpublish. -->
      <div class="cluster gap-3 hairline-t pt-5">
        <button
          v-if="published"
          type="button"
          class="btn end"
          data-size="s"
          :disabled="pending"
          :aria-busy="(pending && saving === false) || undefined"
          @click="saveAs(false)"
        >
          Unpublish
        </button>
        <button
          type="submit"
          class="btn"
          :class="{ end: !published }"
          data-size="s"
          :data-variant="published ? 'primary' : undefined"
          :disabled="pending"
          :aria-busy="(pending && saving === published) || undefined"
        >
          {{ published ? 'Save' : 'Save draft' }}
        </button>
        <button
          v-if="!published"
          type="button"
          class="btn"
          data-size="s"
          data-variant="primary"
          :disabled="pending"
          :aria-busy="(pending && saving === true) || undefined"
          @click="saveAs(true)"
        >
          Publish
        </button>
      </div>
    </form>

    <AppSection title="As the API delivers it">
      <pre class="snippet font-mono text-xs"><code>{{ delivered }}</code></pre>
    </AppSection>
  </div>
</template>
