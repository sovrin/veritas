<script setup lang="ts">
import type { Collection, Field, FieldType } from '../../shared/contracts'
import { FIELD_TYPES, fieldKey, slugify } from '../../shared/contracts'
import { FIELD_META } from '../lib/fields'

/** Adds a collection to a project, or changes one: its name and fields. A saved field keeps its key
 *  and type, so what is stored always matches what the API promises. */
const props = defineProps<{ projectId: string; collection?: Collection }>()
const emit = defineEmits<{ saved: [Collection] }>()

const name = ref(props.collection?.name ?? '')
const slug = ref(props.collection?.slug ?? '')
const slugTouched = ref(!!props.collection)
// A new collection's slug follows its name until it is edited by hand.
watch(name, (value) => {
  if (!slugTouched.value) slug.value = slugify(value)
})

interface Row extends Field {
  saved: boolean
  keyTouched: boolean
}
const rows = ref<Row[]>(
  props.collection?.fields.map((field) => ({ ...field, saved: true, keyTouched: true })) ?? [],
)
const types = Object.keys(FIELD_TYPES) as FieldType[]
// Focus follows the change: into the new field's label, or, after a removal, to "Add a field".
const addButton = ref<HTMLButtonElement>()
async function addField() {
  rows.value.push({ key: '', label: '', type: 'text', saved: false, keyTouched: false })
  await nextTick()
  document.getElementById(`label-${rows.value.length - 1}`)?.focus()
}
async function removeField(index: number) {
  rows.value.splice(index, 1)
  await nextTick()
  addButton.value?.focus()
}
// A new field's key follows its label until it is edited by hand.
function labelled(row: Row) {
  if (!row.keyTouched) row.key = fieldKey(row.label)
}

const { pending, error, issues, fieldError, submit } = useSubmit()

async function save() {
  const settings = {
    name: name.value,
    fields: rows.value.map(({ key, label, type }) => ({ key: key.trim(), label, type })),
  }
  const base = `/api/p/${props.projectId}/content/collections`
  const saved = await submit(() =>
    $fetch<Collection>(props.collection ? `${base}/${props.collection.slug}` : base, {
      method: 'POST',
      body: props.collection ? settings : { ...settings, slug: slug.value },
    }),
  )
  if (saved) emit('saved', saved)
}
</script>

<template>
  <form class="stack gap-5" @submit.prevent="save">
    <fieldset :disabled="pending" class="stack gap-5">
      <div class="field">
        <label for="name">Name</label>
        <input
          id="name"
          v-model="name"
          class="input"
          data-size="s"
          required
          maxlength="60"
          placeholder="Posts"
          autocomplete="off"
          :aria-invalid="!!fieldError('name') || undefined"
        />
        <span v-if="fieldError('name')" data-error>{{ fieldError('name') }}</span>
      </div>
      <div class="field">
        <label for="slug">Slug</label>
        <input
          id="slug"
          v-model="slug"
          class="input font-mono text-s"
          data-size="s"
          required
          maxlength="64"
          autocomplete="off"
          spellcheck="false"
          :readonly="!!collection"
          :aria-invalid="!!fieldError('slug') || undefined"
          aria-describedby="slug-help"
          @input="slugTouched = true"
        />
        <small id="slug-help">{{
          collection
            ? 'Fixed: the API addresses the collection by it.'
            : 'Part of the API address. It cannot change later.'
        }}</small>
        <span v-if="fieldError('slug')" data-error>{{ fieldError('slug') }}</span>
      </div>

      <AppSection title="Fields">
        <p class="text-s text-muted">Every entry has a title and a slug; these come on top.</p>
        <ul v-if="rows.length" data-variant="plain" class="stack gap-3" aria-label="Fields">
          <li v-for="(row, index) in rows" :key="index" class="stack gap-2 py-3 hairline-b">
            <div class="cluster gap-3 flex-nowrap items-start">
              <div class="field flex-1 min-w-0">
                <label :for="`label-${index}`">Label</label>
                <input
                  :id="`label-${index}`"
                  v-model="row.label"
                  class="input"
                  data-size="s"
                  required
                  maxlength="60"
                  placeholder="Hero image"
                  autocomplete="off"
                  :aria-invalid="!!fieldError(`fields.${index}.label`) || undefined"
                  @input="labelled(row)"
                />
              </div>
              <div class="field flex-1 min-w-0">
                <label :for="`key-${index}`">Key</label>
                <input
                  :id="`key-${index}`"
                  v-model="row.key"
                  class="input font-mono text-s"
                  data-size="s"
                  required
                  maxlength="40"
                  autocomplete="off"
                  spellcheck="false"
                  :readonly="row.saved"
                  :aria-invalid="!!fieldError(`fields.${index}.key`) || undefined"
                  @input="row.keyTouched = true"
                />
              </div>
              <div class="field">
                <label :for="`type-${index}`">Type</label>
                <select
                  :id="`type-${index}`"
                  v-model="row.type"
                  class="input"
                  data-size="s"
                  :disabled="row.saved"
                >
                  <option v-for="type in types" :key="type" :value="type">
                    {{ FIELD_TYPES[type] }}
                  </option>
                </select>
              </div>
            </div>
            <div class="cluster justify-between gap-3">
              <small class="text-muted cluster gap-1 flex-nowrap"
                ><i
                  class="icon"
                  :data-icon="FIELD_META[row.type].icon"
                  data-size="s"
                  aria-hidden="true"
                ></i
                >{{ FIELD_META[row.type].hint }}</small
              >
              <button type="button" class="link text-s text-danger" @click="removeField(index)">
                Remove
              </button>
            </div>
            <span v-if="fieldError(`fields.${index}`)" data-error>{{
              fieldError(`fields.${index}`)
            }}</span>
          </li>
        </ul>
        <p>
          <button ref="addButton" type="button" class="link text-s" @click="addField">
            Add a field
          </button>
        </p>
        <span v-if="fieldError('fields') && !rows.length" data-error>{{
          fieldError('fields')
        }}</span>
      </AppSection>
    </fieldset>

    <FormIssues :error="error" :issues="issues" failed="Could not save the collection." />

    <div class="cluster gap-3 hairline-t pt-5">
      <p class="caption">Removing a field stops the API delivering it.</p>
      <button
        type="submit"
        class="btn end"
        data-size="s"
        data-variant="primary"
        :disabled="pending"
        :aria-busy="pending || undefined"
      >
        {{ collection ? 'Save changes' : 'Add collection' }}
      </button>
    </div>
  </form>
</template>
