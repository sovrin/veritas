<script setup lang="ts">
import { errorMessage } from '#nexitas/app/lib/format'
import type { Collection } from '../../../../../../shared/contracts'

// A collection's name and fields, and deleting it.
const route = useRoute()
const project = useProject().id.value
const slug = route.params.collection as string
// Not live: the form is keyed by what it shows, so a refresh would reset what is being typed.
const {
  data: collection,
  error,
  refresh,
} = await useProjectFetch<Collection>(`/content/collections/${slug}`, { live: false })

const savedNotice = ref(false)
async function saved() {
  await refresh()
  savedNotice.value = true
}

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
  <AppPage
    title="Fields"
    :trail="[{ label: collection?.name ?? slug, to: `/p/${project}/content/${slug}` }]"
    failed="Could not load this collection."
    :error="error"
  >
    <template v-if="collection" #actions>
      <DangerAction
        label="Delete collection"
        :title="`Delete ${slug} and its entries?`"
        :confirm-word="slug"
        @confirm="remove"
      >
        Removes the collection and every entry in it. This cannot be undone.
      </DangerAction>
    </template>
    <template v-if="collection">
      <AppAlert v-if="deleteError" title="Could not delete the collection.">{{
        deleteError
      }}</AppAlert>
      <AppAlert v-if="savedNotice" tone="success" title="Saved."
        >The API delivers the new fields from now on.</AppAlert
      >
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
  </AppPage>
</template>
