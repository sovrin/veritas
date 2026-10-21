<script setup lang="ts">
import { formatAge } from '#nexitas/app/lib/format'
import type { Collection, EntrySummary } from '../../../../../../shared/contracts'
import { FIELD_META, deliveryPath } from '../../../../../lib/fields'

// One collection's entries, newest first.
const route = useRoute()
const project = useProject().id.value
const slug = route.params.collection as string
const {
  data: collection,
  error,
  refresh,
} = await useProjectFetch<Collection & { entries: EntrySummary[] }>(`/content/collections/${slug}`)
const published = computed(
  () => collection.value?.entries.filter((entry) => entry.published).length ?? 0,
)
</script>

<template>
  <AppPage
    :title="collection?.name ?? slug"
    failed="Could not load this collection."
    :error="error"
    :retry="refresh"
  >
    <template v-if="collection" #subtitle>
      {{ published }} of {{ collection.entries.length }} published ·
      <span class="font-mono">{{ deliveryPath(project, slug) }}</span>
    </template>
    <template v-if="collection" #actions>
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
    </template>

    <template v-if="collection">
      <DataTable v-if="collection.entries.length">
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
            </td>
            <td class="text-s">
              <StateDot :tone="entry.published ? 'success' : undefined">{{
                entry.published ? 'published' : 'draft'
              }}</StateDot>
            </td>
            <td data-num class="text-muted">
              <time>{{ formatAge(entry.updatedAt) }}</time>
            </td>
          </tr>
        </tbody>
      </DataTable>
      <EmptyState v-else>
        No entries yet. New entries stay drafts until you publish them.
      </EmptyState>

      <p class="text-s text-muted">
        <template v-if="collection.fields.length">
          <span v-for="(field, index) in collection.fields" :key="field.key"
            ><template v-if="index"> · </template
            ><i
              class="icon"
              :data-icon="FIELD_META[field.type].icon"
              data-size="s"
              aria-hidden="true"
            ></i>
            {{ field.label }}</span
          >
        </template>
        <template v-else>Title and slug only.</template>
      </p>
    </template>
  </AppPage>
</template>
