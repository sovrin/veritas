<script setup lang="ts">
import { errorMessage, formatTime } from '#nexitas/app/lib/format'
import type { Collection, Entry } from '../../../../../../shared/contracts'

// One entry: its form, what the API delivers for it, and deleting it.
const route = useRoute()
const project = useProject().id.value
const slug = route.params.collection as string
const entrySlug = route.params.slug as string
const path = `/content/collections/${slug}`
// Not live: the form is keyed by the entry's save, so a refresh would reset what is being typed.
const [{ data: collection, error: collectionError }, { data: entry, error, refresh }] =
  await Promise.all([
    useProjectFetch<Collection>(path, { live: false }),
    useProjectFetch<Entry>(`${path}/entries/${entrySlug}`, { live: false }),
  ])

const savedNotice = ref(false)
async function saved() {
  await refresh()
  savedNotice.value = true
}

const deleteError = ref('')
async function remove() {
  deleteError.value = ''
  try {
    await $fetch(`/api/p/${project}${path}/entries/${entrySlug}/delete`, {
      method: 'POST',
      body: {},
    })
    await navigateTo(`/p/${project}/content/${slug}`)
  } catch (cause) {
    deleteError.value = errorMessage(cause)
  }
}
</script>

<template>
  <AppPage
    :title="entry?.title ?? entrySlug"
    :trail="[{ label: collection?.name ?? slug, to: `/p/${project}/content/${slug}` }]"
    failed="Could not load this entry."
    :error="error || collectionError"
  >
    <template v-if="entry" #subtitle>
      {{ entry.published ? 'Published' : 'Draft' }} · saved {{ formatTime(entry.updatedAt) }}
    </template>
    <template v-if="entry && collection">
      <AppAlert v-if="deleteError" title="Could not delete the entry.">{{ deleteError }}</AppAlert>
      <AppAlert v-if="savedNotice" tone="success" title="Saved.">{{
        entry.published ? 'The API delivers it as the preview shows.' : 'It stays a draft.'
      }}</AppAlert>
      <EntryForm
        :key="entry.updatedAt"
        :project-id="project"
        :collection="collection"
        :entry="entry"
        @saved="saved"
      />
    </template>
    <template v-if="entry && collection" #danger>
      <span>Removes the entry from the collection and the API.</span>
      <DangerAction label="Delete entry" :title="`Delete ${entrySlug}?`" @confirm="remove">
        This cannot be undone.
      </DangerAction>
    </template>
  </AppPage>
</template>
