<script setup lang="ts">
import { errorMessage, formatTime } from '#nexitas/app/lib/format'
import type { Collection, Entry } from '../../../../../../shared/contracts'
import EntryList from '../../../../../components/EntryList.vue'

// One entry, opened beside the collection's entries: its form, what the API delivers for it, and
// deleting it at the inspector's foot.
const route = useRoute()
const project = useProject().id.value
const slug = route.params.collection as string
const entrySlug = route.params.slug as string
const path = `/content/collections/${slug}`
// Not live: the form is keyed by the entry's save, so a refresh would reset what is being typed.
const [{ data: collection, error: collectionError }, { data: entry, error }] = await Promise.all([
  useProjectFetch<Collection>(path, { live: false }),
  useProjectFetch<Entry>(`${path}/entries/${entrySlug}`, { live: false }),
])

const savedNotice = ref(false)
async function saved() {
  // The entry and the list beside it.
  await refreshNuxtData()
  savedNotice.value = true
}

const { pending, error: deleteError, submit } = useSubmit()
async function remove() {
  const done = await submit(() =>
    $fetch(`/api/p/${project}${path}/entries/${entrySlug}/delete`, { method: 'POST', body: {} }),
  )
  if (done) await navigateTo({ path: `/p/${project}/content/${slug}`, query: route.query })
}
</script>

<template>
  <EntryList :selected="entrySlug" :aside-name="entrySlug" aside-mono>
    <template #aside>
      <AppAlert v-if="error || collectionError" title="Could not load this entry.">{{
        errorMessage(error || collectionError)
      }}</AppAlert>
      <template v-else-if="entry && collection">
        <p class="cluster gap-2 text-s">
          <StateDot :tone="entry.published ? 'success' : undefined">{{
            entry.published ? 'published' : 'draft'
          }}</StateDot>
          <span class="text-muted">saved {{ formatTime(entry.updatedAt) }}</span>
        </p>
        <AppAlert v-if="savedNotice" tone="success" title="Saved." />
        <EntryForm
          :key="entry.updatedAt"
          :project-id="project"
          :collection="collection"
          :entry="entry"
          @saved="saved"
        />
      </template>
    </template>
    <template v-if="entry && collection" #danger>
      <span>Removes the entry from the collection and the API.</span>
      <DangerAction
        label="Delete entry"
        :title="`Delete ${entrySlug}?`"
        :pending="pending"
        @confirm="remove"
      >
        This cannot be undone.
      </DangerAction>
      <AppAlert v-if="deleteError" class="w-full" title="Could not delete the entry.">{{
        deleteError
      }}</AppAlert>
    </template>
  </EntryList>
</template>
