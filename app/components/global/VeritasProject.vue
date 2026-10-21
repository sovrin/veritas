<script setup lang="ts">
import { errorMessage } from '#nexitas/app/lib/format'
import type { ProjectSummary } from '#nexitas/shared/contracts'
import type { ContentSpace } from '../../../shared/contracts'

/** veritas' part of a project's page: its content, or a way to start it. */
const props = defineProps<{ project: ProjectSummary }>()
const base = `/api/p/${props.project.id}/content`
const { data: space, error, refresh } = await useFetch<ContentSpace>(base)
useLive(refresh)
// The project exists (its page saw to that), so a 404 means no content yet.
const notStarted = computed(() => error.value?.statusCode === 404)
const count = (key: 'entries' | 'published') =>
  space.value?.collections.reduce((sum, collection) => sum + collection[key], 0) ?? 0

const pending = ref(false)
const startError = ref('')
async function start() {
  pending.value = true
  startError.value = ''
  try {
    await $fetch(base, { method: 'POST', body: {} })
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
    <div v-if="error && !notStarted" class="alert" data-tone="danger" role="alert">
      <div><strong>Could not load its content.</strong> {{ errorMessage(error) }}</div>
    </div>
    <template v-else-if="space">
      <p class="cluster gap-3 text-s">
        <span class="text-muted"
          >{{ space.collections.length }}
          {{ space.collections.length === 1 ? 'collection' : 'collections' }} ·
          {{ count('published') }} of {{ count('entries') }} published</span
        >
        <NuxtLink :to="`/p/${project.id}/content`" class="link">Collections and API</NuxtLink>
      </p>
    </template>
    <template v-else-if="notStarted">
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
