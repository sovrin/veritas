<script setup lang="ts">
import { errorMessage } from '#nexitas/app/lib/format'
import type { Collection } from '../../../../../../shared/contracts'

// A collection's name and fields, and deleting it.
const route = useRoute()
const project = useProject().id.value
const slug = route.params.collection as string
useHead({ title: `${slug} fields · ${project}` })
// Not live: the form is keyed by what it shows, so a refresh would reset what is being typed.
const {
  data: collection,
  error,
  refresh,
} = await useFetch<Collection>(`/api/p/${project}/content/collections/${slug}`)

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
    await $fetch(`/api/p/${project}/content/collections/${slug}/delete`, {
      method: 'POST',
      body: {},
    })
    await navigateTo(`/p/${project}/content`)
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
        <li aria-current="page">Fields</li>
      </ol>
    </nav>

    <div v-if="error" class="alert" data-tone="danger" role="alert">
      <div><strong>Could not load this collection.</strong> {{ errorMessage(error) }}</div>
    </div>
    <template v-else-if="collection">
      <div class="page-header">
        <h1 class="text-xl weight-600">{{ collection.name }}</h1>
        <button
          type="button"
          class="btn"
          data-size="s"
          data-variant="ghost"
          data-tone="danger"
          @click="deleteOpen = true"
        >
          Delete collection
        </button>
      </div>
      <div v-if="deleteError" class="alert" data-tone="danger" role="alert">
        <div><strong>Could not delete the collection.</strong> {{ deleteError }}</div>
      </div>
      <div v-if="savedNotice" class="alert" data-tone="success" role="status">
        <div><strong>Saved.</strong> The API delivers the new fields from now on.</div>
      </div>
      <!-- A form reads best at a line's length, however wide the window. -->
      <div class="measure">
        <CollectionForm
          :key="JSON.stringify([collection.name, collection.fields])"
          :project-id="project"
          :collection="collection"
          @saved="saved"
        />
      </div>
    </template>

    <ConfirmDialog
      v-model:open="deleteOpen"
      :title="`Delete ${slug} and its entries?`"
      confirm-label="Delete collection"
      tone="danger"
      :confirm-word="slug"
      @confirm="remove"
    >
      <template #description
        >Removes the collection and every entry in it. This cannot be undone.</template
      >
    </ConfirmDialog>
  </div>
</template>
