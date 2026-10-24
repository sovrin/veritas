<script setup lang="ts">
import type { Collection } from '../../../../../shared/contracts'
const project = useProject().id.value
const saved = (collection: Collection) => navigateTo(`/p/${project}/content/${collection.slug}`)
</script>

<template>
  <AppPage title="New collection">
    <!-- A form reads best at a line's length, however wide the window. -->
    <div class="measure">
      <CollectionForm :project-id="project" @saved="saved" />
    </div>
  </AppPage>
</template>
