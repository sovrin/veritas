<script setup lang="ts">
import { errorMessage } from '#nexitas/app/lib/format'
import type { Collection, EntrySummary } from '../../../../../../shared/contracts'
import { FIELD_META, deliveryPath, shortDate } from '../../../../../lib/fields'

// One collection's entries, newest first.
const route = useRoute()
const project = useProject().id.value
const slug = route.params.collection as string
useHead({ title: `${slug} · ${useRuntimeConfig().public.nexitas.name}` })
const {
  data: collection,
  error,
  refresh,
} = await useFetch<Collection & { entries: EntrySummary[] }>(
  `/api/p/${project}/content/collections/${slug}`,
)
useLive(refresh)
const published = computed(
  () => collection.value?.entries.filter((entry) => entry.published).length ?? 0,
)
</script>

<template>
  <div class="stack gap-5">
    <nav aria-label="Breadcrumb">
      <ol class="breadcrumb">
        <li><NuxtLink :to="`/p/${project}/content`">Content</NuxtLink></li>
        <li aria-current="page">{{ collection?.name ?? slug }}</li>
      </ol>
    </nav>

    <div v-if="error" class="alert" data-tone="danger" role="alert">
      <div><strong>Could not load this collection.</strong> {{ errorMessage(error) }}</div>
      <button type="button" class="btn" data-size="s" @click="refresh()">Try again</button>
    </div>
    <template v-else-if="collection">
      <div class="page-header">
        <div class="stack gap-1 min-w-0">
          <h1 class="text-xl weight-600">{{ collection.name }}</h1>
          <p class="text-s text-muted">
            {{ published }} of {{ collection.entries.length }} published ·
            <span class="font-mono">{{ deliveryPath(project, slug) }}</span>
          </p>
        </div>
        <div class="cluster gap-2">
          <NuxtLink :to="`/p/${project}/content/${slug}/_fields`" class="btn" data-size="s"
            >Fields</NuxtLink
          >
          <NuxtLink
            :to="`/p/${project}/content/${slug}/_new`"
            class="btn"
            data-size="s"
            data-variant="primary"
            >New entry</NuxtLink
          >
        </div>
      </div>

      <div v-if="collection.entries.length" class="table-scroll">
        <table class="table" data-size="s">
          <thead>
            <tr>
              <th scope="col">Entry</th>
              <th scope="col">State</th>
              <th scope="col" data-num>Saved</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in collection.entries" :key="entry.slug">
              <td>
                <span class="cluster gap-3 flex-nowrap items-baseline">
                  <span
                    class="dot"
                    :data-tone="entry.published ? 'success' : undefined"
                    aria-hidden="true"
                  ></span>
                  <span class="stack gap-1 min-w-0">
                    <!-- A draft recedes to muted; what the API delivers stands in full ink. -->
                    <NuxtLink
                      :to="`/p/${project}/content/${slug}/${entry.slug}`"
                      class="link break-words"
                      :class="entry.published ? 'weight-600' : 'text-muted'"
                      >{{ entry.title }}</NuxtLink
                    >
                    <span class="font-mono text-xs text-muted">{{ entry.slug }}</span>
                  </span>
                </span>
              </td>
              <td class="text-s" :class="entry.published ? 'text-success' : 'text-muted'">
                {{ entry.published ? 'published' : 'draft' }}
              </td>
              <td data-num class="text-muted">
                <time>{{ shortDate(entry.updatedAt) }}</time>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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
    </template>
  </div>
</template>
