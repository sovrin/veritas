<script setup lang="ts">
import type { Collection } from '../../../../../shared/contracts'
const project = useProject().id.value
useHead({ title: `Add a collection · ${useRuntimeConfig().public.nexitas.name}` })
const saved = (collection: Collection) => navigateTo(`/p/${project}/content/${collection.slug}`)
</script>

<template>
  <div class="stack gap-5">
    <nav aria-label="Breadcrumb">
      <ol class="breadcrumb">
        <li><NuxtLink :to="`/p/${project}/content`">Content</NuxtLink></li>
        <li aria-current="page">Add a collection</li>
      </ol>
    </nav>
    <div class="page-header">
      <h1 class="text-xl weight-600">Add a collection</h1>
    </div>
    <!-- A form reads best at a line's length, however wide the window. -->
    <div class="measure">
      <CollectionForm :project-id="project" @saved="saved" />
    </div>
  </div>
</template>
