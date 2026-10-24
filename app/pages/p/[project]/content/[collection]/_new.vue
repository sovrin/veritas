<script setup lang="ts">
import { errorMessage } from '#nexitas/app/lib/format'
import type { Collection, Entry } from '../../../../../../shared/contracts'
import EntryList from '../../../../../components/EntryList.vue'

// A new entry, written in the inspector beside the collection's entries.
const route = useRoute()
const project = useProject().id.value
const slug = route.params.collection as string
// Not live: the form is built from the collection's fields once, and a refresh would change them
// under what is being typed.
const { data: collection, error } = await useProjectFetch<Collection>(
  `/content/collections/${slug}`,
  { live: false },
)
const saved = (entry: Entry) =>
  navigateTo({ path: `/p/${project}/content/${slug}/${entry.slug}`, query: route.query })
</script>

<template>
  <EntryList aside-title="New entry">
    <template #aside>
      <AppAlert v-if="error" title="Could not load this collection.">{{
        errorMessage(error)
      }}</AppAlert>
      <EntryForm
        v-else-if="collection"
        :project-id="project"
        :collection="collection"
        @saved="saved"
      />
    </template>
  </EntryList>
</template>
