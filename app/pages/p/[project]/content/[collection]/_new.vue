<script setup lang="ts">
import type { Collection, Entry } from '../../../../../../shared/contracts'
const route = useRoute()
const project = useProject().id.value
const slug = route.params.collection as string
// Not live: the form is built from the collection's fields once, and a refresh would change them
// under what is being typed.
const { data: collection, error } = await useProjectFetch<Collection>(
  `/content/collections/${slug}`,
  { live: false },
)
const saved = (entry: Entry) => navigateTo(`/p/${project}/content/${slug}/${entry.slug}`)
</script>

<template>
  <AppPage
    title="New entry"
    :trail="[{ label: collection?.name ?? slug, to: `/p/${project}/content/${slug}` }]"
    failed="Could not load this collection."
    :error="error"
  >
    <EntryForm v-if="collection" :project-id="project" :collection="collection" @saved="saved" />
  </AppPage>
</template>
