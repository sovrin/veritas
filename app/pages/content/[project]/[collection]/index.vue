<script setup lang="ts">
import { errorMessage } from '#nexitas/app/lib/format'
import type { Collection, EntrySummary } from '../../../../../shared/contracts'
import { FIELD_META, deliveryPath, shortDate } from '../../../../lib/fields'

// One collection's entries, newest first.
const route = useRoute()
const id = route.params.project as string
const slug = route.params.collection as string
useHead({ title: `${slug} · ${useRuntimeConfig().public.nexitas.name}` })
const {
  data: collection,
  error,
  refresh,
} = await useFetch<Collection & { entries: EntrySummary[] }>(
  `/api/content/${id}/collections/${slug}`,
)
useLive(refresh)
const published = computed(
  () => collection.value?.entries.filter((entry) => entry.published).length ?? 0,
)
</script>

<template>
  <div>
    <nav aria-label="Breadcrumb" class="mb-5">
      <ol class="breadcrumb">
        <li><NuxtLink to="/content">Content</NuxtLink></li>
        <li>
          <NuxtLink :to="`/content/${id}`" class="font-mono">{{ id }}</NuxtLink>
        </li>
        <li aria-current="page">{{ collection?.name ?? slug }}</li>
      </ol>
    </nav>

    <div v-if="error" class="alert" data-tone="danger" role="alert">
      <div><strong>Could not load this collection.</strong> {{ errorMessage(error) }}</div>
      <button type="button" class="btn" data-size="s" @click="refresh()">Try again</button>
    </div>
    <div v-else-if="collection" class="stack gap-5">
      <div class="cluster justify-between gap-4">
        <h1 class="text-l weight-600">{{ collection.name }}</h1>
        <span class="cluster gap-4 text-s">
          <NuxtLink :to="`/content/${id}/${slug}/_fields`" class="link">Fields</NuxtLink>
          <NuxtLink :to="`/content/${id}/${slug}/_new`" class="link">New entry</NuxtLink>
        </span>
      </div>

      <ul v-if="collection.entries.length" data-variant="plain" aria-label="Entries">
        <li v-for="entry in collection.entries" :key="entry.slug" class="py-3 hairline-b">
          <div class="cluster gap-3 flex-nowrap">
            <span
              class="dot"
              :data-tone="entry.published ? 'success' : undefined"
              aria-hidden="true"
            ></span>
            <!-- A draft recedes to muted; what the API delivers stands in full ink. -->
            <NuxtLink
              :to="`/content/${id}/${slug}/${entry.slug}`"
              class="link flex-1 min-w-0 truncate"
              :class="entry.published ? 'weight-600' : 'text-muted'"
              data-quiet
              >{{ entry.title }}</NuxtLink
            >
            <span class="text-s" :class="entry.published ? 'text-success' : 'text-muted'">{{
              entry.published ? 'published' : 'draft'
            }}</span>
            <time class="text-s text-muted tabular">{{ shortDate(entry.updatedAt) }}</time>
          </div>
          <p class="ps-4 font-mono text-xs text-muted">{{ entry.slug }}</p>
        </li>
      </ul>
      <p v-else class="text-muted">
        No entries yet. New entries stay drafts until you publish them.
      </p>

      <p class="text-s text-muted">
        <template v-if="collection.fields.length">
          <span v-for="(field, index) in collection.fields" :key="field.key"
            ><template v-if="index"> · </template
            ><i class="icon" :data-icon="FIELD_META[field.type].icon" data-size="s"></i>
            {{ field.label }}</span
          >
        </template>
        <template v-else>Title and slug only.</template>
      </p>
      <p class="font-mono text-xs text-muted">
        {{ published }} of {{ collection.entries.length }} published ·
        {{ deliveryPath(id, slug) }}
      </p>
    </div>
  </div>
</template>
