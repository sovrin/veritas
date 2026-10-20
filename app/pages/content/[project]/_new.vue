<script setup lang="ts">
import type { Collection } from '../../../../shared/contracts'
const id = useRoute().params.project as string
useHead({ title: `Add a collection · ${useRuntimeConfig().public.nexitas.name}` })
const saved = (collection: Collection) => navigateTo(`/content/${id}/${collection.slug}`)
</script>

<template>
  <div>
    <nav aria-label="Breadcrumb" class="mb-5">
      <ol class="breadcrumb">
        <li><NuxtLink to="/content">Content</NuxtLink></li>
        <li>
          <NuxtLink :to="`/content/${id}`" class="font-mono">{{ id }}</NuxtLink>
        </li>
        <li aria-current="page">Add a collection</li>
      </ol>
    </nav>
    <h1 class="text-l weight-600 mb-5">Add a collection</h1>
    <CollectionForm :project-id="id" @saved="saved" />
  </div>
</template>
