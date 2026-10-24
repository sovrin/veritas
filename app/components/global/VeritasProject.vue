<script setup lang="ts">
import { errorMessage } from '#nexitas/app/lib/format'
import type { ProjectSummary } from '#nexitas/shared/contracts'
import type { ContentSpace } from '../../../shared/contracts'
import { deliverySnippet } from '../../lib/fields'

/** veritas' part of a project's page: how its sites read its content, or a way to start it. */
const props = defineProps<{ project: ProjectSummary }>()
const { data: space, error, refresh } = await useProjectFetch<ContentSpace>('/content')
// The project exists (its page saw to that), so a 404 means no content yet.
const notStarted = computed(() => error.value?.statusCode === 404)
const origin = useRequestURL().origin

async function start() {
  await $fetch(`/api/p/${props.project.id}/content`, { method: 'POST', body: {} })
  await refresh()
}
</script>

<template>
  <!-- Under the module's name and icon, which the project page puts above it. -->
  <AppAlert v-if="error && !notStarted" title="Could not load its content.">{{
    errorMessage(error)
  }}</AppAlert>
  <EmbedCode v-else-if="space" :code="deliverySnippet(origin, project.id, space.token)" />
  <PanelStart
    v-else-if="notStarted"
    label="Start content"
    failed="Could not start its content."
    :start="start"
  >
    No content yet. Start, and you get collections to write in and a token to read them with.
  </PanelStart>
</template>
