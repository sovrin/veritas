<script setup lang="ts">
import { errorMessage, plural } from '#nexitas/app/lib/format'
import type { ProjectSummary } from '#nexitas/shared/contracts'
import type { ContentSpace } from '../../../shared/contracts'

/** veritas' part of a project's page: its content, or a way to start it. */
const props = defineProps<{ project: ProjectSummary }>()
const { data: space, error, refresh } = await useProjectFetch<ContentSpace>('/content')
// The project exists (its page saw to that), so a 404 means no content yet.
const notStarted = computed(() => error.value?.statusCode === 404)
const count = (key: 'entries' | 'published') =>
  space.value?.collections.reduce((sum, collection) => sum + collection[key], 0) ?? 0

async function start() {
  await $fetch(`/api/p/${props.project.id}/content`, { method: 'POST', body: {} })
  await refresh()
}
</script>

<template>
  <!-- Under the module's name and icon, which the project page puts above it. -->
  <div class="stack gap-3">
    <AppAlert v-if="error && !notStarted" title="Could not load its content.">{{
      errorMessage(error)
    }}</AppAlert>
    <template v-else-if="space">
      <p class="cluster gap-3">
        <span class="text-muted"
          >{{ plural(space.collections.length, 'collection') }} · {{ count('published') }} of
          {{ count('entries') }} published</span
        >
        <NuxtLink :to="`/p/${project.id}/content`" class="link">Collections and API</NuxtLink>
      </p>
    </template>
    <PanelStart
      v-else-if="notStarted"
      label="Start content"
      failed="Could not start its content."
      :start="start"
    >
      No content yet. Start, and you get collections to write in and a token to read them with.
    </PanelStart>
  </div>
</template>
