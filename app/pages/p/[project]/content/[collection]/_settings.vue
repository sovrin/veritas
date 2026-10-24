<script setup lang="ts">
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

const { pending, error: deleteError, submit } = useSubmit()
async function remove() {
  const done = await submit(() =>
    $fetch(`/api/p/${project}/content/collections/${slug}/delete`, { method: 'POST', body: {} }),
  )
  if (done) await navigateTo(`/p/${project}/content`)
}
</script>

<template>
  <AppPage
    title="Settings"
    :trail="[{ label: collection?.name ?? slug, to: `/p/${project}/content/${slug}` }]"
    failed="Could not load this collection."
    :error="error"
  >
    <template v-if="collection">
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
    <template v-if="collection" #danger>
      <span>Removes the collection and every entry in it.</span>
      <DangerAction
        label="Delete collection"
        :title="`Delete ${slug} and its entries?`"
        :confirm-word="slug"
        :pending="pending"
        @confirm="remove"
      >
        This cannot be undone.
      </DangerAction>
      <AppAlert v-if="deleteError" class="w-full" title="Could not delete the collection.">{{
        deleteError
      }}</AppAlert>
    </template>
  </AppPage>
</template>
