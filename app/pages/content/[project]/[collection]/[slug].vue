<script setup lang="ts">
import { errorMessage } from '#nexitas/app/lib/format'
import type { Collection, Entry } from '../../../../../shared/contracts'
import { longDate } from '../../../../lib/fields'

// One entry: its form, what the API delivers for it, and deleting it.
const route = useRoute()
const id = route.params.project as string
const slug = route.params.collection as string
const entrySlug = route.params.slug as string
useHead({ title: `${entrySlug} · ${useRuntimeConfig().public.nexitas.name}` })
const base = `/api/content/${id}/collections/${slug}`
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
    await navigateTo(`/content/${id}/${slug}`)
  } catch (cause) {
    deleteError.value = errorMessage(cause)
  }
}
</script>

<template>
  <div>
    <nav aria-label="Breadcrumb" class="mb-5">
      <ol class="breadcrumb">
        <li><NuxtLink to="/content">Content</NuxtLink></li>
        <li>
          <NuxtLink :to="`/content/${id}`" class="font-mono">{{ id }}</NuxtLink>
        </li>
        <li>
          <NuxtLink :to="`/content/${id}/${slug}`">{{ collection?.name ?? slug }}</NuxtLink>
        </li>
        <li aria-current="page" class="font-mono">{{ entrySlug }}</li>
      </ol>
    </nav>

    <div v-if="error || collectionError" class="alert" data-tone="danger" role="alert">
      <div>
        <strong>Could not load this entry.</strong> {{ errorMessage(error || collectionError) }}
      </div>
    </div>
    <div v-else-if="entry && collection" class="stack gap-6">
      <div class="stack gap-1">
        <h1 class="text-l weight-600">{{ entry.title }}</h1>
        <p class="text-s text-muted">
          {{ entry.published ? 'Published' : 'Draft' }} · saved {{ longDate(entry.updatedAt) }}
        </p>
      </div>
      <div v-if="savedNotice" class="alert" data-tone="success" role="status">
        <div>
          <strong>Saved.</strong>
          {{ entry.published ? 'The API delivers it as shown below.' : 'It stays a draft.' }}
        </div>
      </div>
      <EntryForm
        :key="entry.updatedAt"
        :project-id="id"
        :collection="collection"
        :entry="entry"
        @saved="saved"
      />

      <section class="stack gap-3 hairline-t pt-5" aria-labelledby="delete-title">
        <h2 id="delete-title" class="text-s weight-600">Delete</h2>
        <p>
          <button type="button" class="link text-danger" @click="deleteOpen = true">
            Delete {{ entry.slug }}
          </button>
        </p>
        <div v-if="deleteError" class="alert" data-tone="danger" role="alert">
          <div><strong>Could not delete the entry.</strong> {{ deleteError }}</div>
        </div>
      </section>
    </div>

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
