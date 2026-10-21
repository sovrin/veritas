<script setup lang="ts">
import { errorMessage } from '#nexitas/app/lib/format'
import type { Collection, Entry } from '../../../../../../shared/contracts'
import { longDate } from '../../../../../lib/fields'

// One entry: its form, what the API delivers for it, and deleting it.
const route = useRoute()
const project = useProject().id.value
const slug = route.params.collection as string
const entrySlug = route.params.slug as string
useHead({ title: `${entrySlug} · ${useRuntimeConfig().public.nexitas.name}` })
const base = `/api/p/${project}/content/collections/${slug}`
const [{ data: collection, error: collectionError }, { data: entry, error, refresh }] =
  await Promise.all([useFetch<Collection>(base), useFetch<Entry>(`${base}/entries/${entrySlug}`)])

const savedNotice = ref(false)
async function saved() {
  await refresh()
  savedNotice.value = true
}

const deleteOpen = ref(false)
const deleteError = ref('')
async function remove() {
  deleteError.value = ''
  try {
    await $fetch(`${base}/entries/${entrySlug}/delete`, { method: 'POST', body: {} })
    await navigateTo(`/p/${project}/content/${slug}`)
  } catch (cause) {
    deleteError.value = errorMessage(cause)
  }
}
</script>

<template>
  <div class="stack gap-5">
    <nav aria-label="Breadcrumb">
      <ol class="breadcrumb">
        <li><NuxtLink :to="`/p/${project}/content`">Content</NuxtLink></li>
        <li>
          <NuxtLink :to="`/p/${project}/content/${slug}`">{{ collection?.name ?? slug }}</NuxtLink>
        </li>
        <li aria-current="page" class="font-mono">{{ entrySlug }}</li>
      </ol>
    </nav>

    <div v-if="error || collectionError" class="alert" data-tone="danger" role="alert">
      <div>
        <strong>Could not load this entry.</strong> {{ errorMessage(error || collectionError) }}
      </div>
    </div>
    <template v-else-if="entry && collection">
      <div class="page-header">
        <div class="stack gap-1 min-w-0">
          <h1 class="text-xl weight-600 break-words">{{ entry.title }}</h1>
          <p class="text-s text-muted">
            {{ entry.published ? 'Published' : 'Draft' }} · saved {{ longDate(entry.updatedAt) }}
          </p>
        </div>
        <button
          type="button"
          class="btn"
          data-size="s"
          data-variant="ghost"
          data-tone="danger"
          @click="deleteOpen = true"
        >
          Delete entry
        </button>
      </div>
      <div v-if="deleteError" class="alert" data-tone="danger" role="alert">
        <div><strong>Could not delete the entry.</strong> {{ deleteError }}</div>
      </div>
      <div v-if="savedNotice" class="alert" data-tone="success" role="status">
        <div>
          <strong>Saved.</strong>
          {{ entry.published ? 'The API delivers it as the preview shows.' : 'It stays a draft.' }}
        </div>
      </div>
      <EntryForm
        :key="entry.updatedAt"
        :project-id="project"
        :collection="collection"
        :entry="entry"
        @saved="saved"
      />
    </template>

    <ConfirmDialog
      v-model:open="deleteOpen"
      :title="`Delete ${entrySlug}?`"
      confirm-label="Delete entry"
      tone="danger"
      @confirm="remove"
    >
      <template #description>This cannot be undone.</template>
    </ConfirmDialog>
  </div>
</template>
