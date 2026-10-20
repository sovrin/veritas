<script setup lang="ts">
// A project opens on its first collection. Without one there is nothing to write yet, so say how to start.
const slug = useRoute().params.project as string
const { data: collections } = await useCollections(slug)
const editor = useCollectionEditor()
if (collections.value[0]) await navigateTo(`/p/${slug}/${collections.value[0].slug}`, { replace: true })
</script>

<template>
  <div class="empty start">
    <i class="icon" data-icon="blocks" data-size="l"></i>
    <h4>Start with a collection</h4>
    <p>A collection is one kind of content, like Posts, Pages or Team members. You choose the fields its entries have.</p>
    <button class="btn" data-variant="primary" data-size="s" @click="editor.open()">
      <i class="icon" data-icon="plus"></i> New collection
    </button>
  </div>
</template>
