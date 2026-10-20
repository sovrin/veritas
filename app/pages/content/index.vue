<script setup lang="ts">
import { errorMessage } from '#nexitas/app/lib/format'
// Every project with content, with how much each holds.
useHead({ title: `Content · ${useRuntimeConfig().public.nexitas.name}` })
const { data, error, refresh } =
  await useFetch<
    { projectId: string; name: string; collections: number; entries: number; published: number }[]
  >('/api/content')
useLive(refresh)
</script>

<template>
  <div class="stack gap-5">
    <h1 class="sr-only">Content</h1>
    <div v-if="error" class="alert" data-tone="danger" role="alert">
      <div><strong>Could not load your content.</strong> {{ errorMessage(error) }}</div>
      <button type="button" class="btn" data-size="s" @click="refresh()">Try again</button>
    </div>
    <template v-else-if="data">
      <ul v-if="data.length" data-variant="plain" aria-label="Projects with content">
        <li v-for="space in data" :key="space.projectId" class="py-3 hairline-b">
          <div class="cluster gap-3 flex-nowrap">
            <NuxtLink
              :to="`/content/${space.projectId}`"
              class="link weight-600 flex-1 min-w-0 break-words"
              data-quiet
              >{{ space.name }}</NuxtLink
            >
            <span class="font-mono text-xs text-muted">{{ space.projectId }}</span>
          </div>
          <p class="text-s text-muted">
            {{ space.collections }} {{ space.collections === 1 ? 'collection' : 'collections' }} ·
            {{ space.published }} of {{ space.entries }} published
          </p>
        </li>
      </ul>
      <p v-else class="text-muted">
        No project has content yet. Start it on a project's page, under Content.
      </p>
    </template>
  </div>
</template>
