<script setup lang="ts">
import { errorMessage } from '#nexitas/app/lib/format'
import type { Collection } from '../../../../../shared/contracts'

// A collection's name and fields, and deleting it.
const route = useRoute()
const id = route.params.project as string
const slug = route.params.collection as string
useHead({ title: `${slug} fields · ${useRuntimeConfig().public.nexitas.name}` })
const {
  data: collection,
  error,
  refresh,
} = await useFetch<Collection>(`/api/content/${id}/collections/${slug}`)

const savedNotice = ref(false)
async function saved() {
  await refresh()
  savedNotice.value = true
}

const deleteOpen = ref(false)
const typed = ref('')
const deleteError = ref('')
async function remove() {
  deleteError.value = ''
  try {
    await $fetch(`/api/content/${id}/collections/${slug}/delete`, { method: 'POST', body: {} })
    await navigateTo(`/content/${id}`)
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
        <li aria-current="page">Fields</li>
      </ol>
    </nav>

    <div v-if="error" class="alert" data-tone="danger" role="alert">
      <div><strong>Could not load this collection.</strong> {{ errorMessage(error) }}</div>
    </div>
    <div v-else-if="collection" class="stack gap-6">
      <h1 class="text-l weight-600">{{ collection.name }}</h1>
      <div v-if="savedNotice" class="alert" data-tone="success" role="status">
        <div><strong>Saved.</strong> The API delivers the new fields from now on.</div>
      </div>
      <CollectionForm
        :key="JSON.stringify([collection.name, collection.fields])"
        :project-id="id"
        :collection="collection"
        @saved="saved"
      />

      <section class="stack gap-3 hairline-t pt-5" aria-labelledby="delete-title">
        <h2 id="delete-title" class="text-s weight-600">Delete</h2>
        <p class="text-s text-muted">Removes the collection and every entry in it.</p>
        <p>
          <button type="button" class="link text-danger" @click="deleteOpen = true">
            Delete {{ collection.slug }}
          </button>
        </p>
        <div v-if="deleteError" class="alert" data-tone="danger" role="alert">
          <div><strong>Could not delete the collection.</strong> {{ deleteError }}</div>
        </div>
      </section>
    </div>

    <ConfirmDialog
      v-model:open="deleteOpen"
      :title="`Delete ${slug} and its entries?`"
      confirm-label="Delete collection"
      tone="danger"
      :disabled="typed !== slug"
      @confirm="remove"
    >
      <template #description>This cannot be undone.</template>
      <div class="field">
        <label for="confirm-slug"
          >Type <span class="font-mono">{{ slug }}</span> to confirm</label
        >
        <input
          id="confirm-slug"
          v-model="typed"
          class="input font-mono text-s"
          autocomplete="off"
        />
      </div>
    </ConfirmDialog>
  </div>
</template>
