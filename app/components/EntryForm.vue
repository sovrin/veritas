<script setup lang="ts">
import type { Collection, Entry } from '../../shared/contracts'
import { coerce, deliver, emptyValue, slugify } from '../../shared/contracts'
import { deliveryPath } from '../lib/fields'

/** Writes a new entry, or edits `entry`. The form follows the collection's fields; beside it stands
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

const { pending, error, issues, fieldError, submit } = useSubmit()

async function save() {
  const body = { title: title.value, fields: values, published: published.value }
  const base = `/api/p/${props.projectId}/content/collections/${props.collection.slug}/entries`
  const saved = await submit(() =>
    $fetch<Entry>(props.entry ? `${base}/${props.entry.slug}` : base, {
      method: 'POST',
      body: props.entry ? body : { ...body, slug: slug.value },
    }),
  )
  if (saved) emit('saved', saved)
}
</script>

<template>
  <!-- The preview lives here, not in the page, so it follows the form's values as they are typed. -->
  <AsideLayout>
    <form class="stack gap-5 min-w-0" @submit.prevent="save">
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
            <textarea
              v-if="field.type === 'markdown'"
              :id="`field-${field.key}`"
              v-model="values[field.key] as string"
              data-size="s"
              class="input font-mono text-s"
              rows="10"
            ></textarea>
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

        <label><input v-model="published" type="checkbox" role="switch" /> Published</label>
      </fieldset>

      <FormIssues :error="error" :issues="issues" failed="Could not save the entry." />

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
    </form>

    <template #aside>
      <AppSection title="As the API delivers it">
        <pre class="snippet font-mono text-xs"><code>{{ delivered }}</code></pre>
      </AppSection>
    </template>
  </AsideLayout>
</template>
