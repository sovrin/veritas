<script setup lang="ts">
import { errorMessage } from '#nexitas/app/lib/format'
import type { ProjectSummary } from '#nexitas/shared/contracts'

/** veritas' part of a project's page: its content, or a way to start it. */
const props = defineProps<{ project: ProjectSummary }>()
const { data, error, refresh } = await useFetch<
  { projectId: string; collections: number; entries: number; published: number }[]
>('/api/content', { key: 'veritas-spaces' })
useLive(refresh)
const space = computed(() => data.value?.find((known) => known.projectId === props.project.id))

const pending = ref(false)
const startError = ref('')
async function start() {
  pending.value = true
  startError.value = ''
  try {
    await $fetch('/api/content', { method: 'POST', body: { projectId: props.project.id } })
    await refresh()
  } catch (cause) {
    startError.value = errorMessage(cause)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <!-- Under the module's name and icon, which the project page puts above it. -->
  <div class="stack gap-3">
    <div v-if="error" class="alert" data-tone="danger" role="alert">
      <div><strong>Could not load its content.</strong> {{ errorMessage(error) }}</div>
    </div>
    <template v-else-if="space">
      <p class="cluster gap-3 text-s">
        <span class="text-muted"
          >{{ space.collections }} {{ space.collections === 1 ? 'collection' : 'collections' }} ·
          {{ space.published }} of {{ space.entries }} published</span
        >
        <NuxtLink :to="`/content/${project.id}`" class="link">Collections and API</NuxtLink>
      </p>
    </template>
    <template v-else-if="data">
      <p class="text-s text-muted">
        No content yet. Start, and you get collections to write in and a token to read them with.
      </p>
      <p>
        <button
          type="button"
          class="btn"
          data-size="s"
          :disabled="pending"
          :aria-busy="pending || undefined"
          @click="start"
        >
          Start content
        </button>
      </p>
      <div v-if="startError" class="alert" data-tone="danger" role="alert">
        <div><strong>Could not start its content.</strong> {{ startError }}</div>
      </div>
    </template>
  </div>
</template>
