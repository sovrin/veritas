<script setup lang="ts">
import type { ContentSpace } from '../../../../../shared/contracts'

// A project's content opens on its first collection: the collections are a switch on that page,
// not a level of their own. Here only what comes before one: content not started, or no
// collection yet.
const project = useProject().id.value
const { data: space, error, refresh } = await useProjectFetch<ContentSpace>('/content')
// The project exists (the core's /p/[project] saw to that), so a 404 means no content yet.
const notStarted = computed(() => error.value?.statusCode === 404)
const first = space.value?.collections[0]
if (first) await navigateTo(`/p/${project}/content/${first.slug}`, { replace: true })
</script>

<template>
  <AppPage
    title="Content"
    failed="Could not load this project's content."
    :error="notStarted ? undefined : error"
    :retry="refresh"
  >
    <template v-if="space" #actions>
      <NuxtLink :to="`/p/${project}/content/_new`" class="btn" data-size="s" data-variant="primary"
        >New collection</NuxtLink
      >
    </template>
    <EmptyState v-if="notStarted">
      This project has no content yet. Start it on
      <NuxtLink :to="`/p/${project}`" class="link">the project's page</NuxtLink>.
    </EmptyState>
    <EmptyState v-else-if="space">
      No collections yet. A collection is one kind of content, such as Posts or Pages.
    </EmptyState>
  </AppPage>
</template>
