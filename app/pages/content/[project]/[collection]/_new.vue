<script setup lang="ts">
import { errorMessage } from '#nexitas/app/lib/format'
import type { Collection, Entry } from '../../../../../shared/contracts'
const route = useRoute()
const id = route.params.project as string
const slug = route.params.collection as string
useHead({ title: `New entry · ${useRuntimeConfig().public.nexitas.name}` })
const { data: collection, error } = await useFetch<Collection>(
  `/api/content/${id}/collections/${slug}`,
)
const saved = (entry: Entry) => navigateTo(`/content/${id}/${slug}/${entry.slug}`)
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
        <li aria-current="page">New entry</li>
      </ol>
    </nav>
    <div v-if="error" class="alert" data-tone="danger" role="alert">
      <div><strong>Could not load this collection.</strong> {{ errorMessage(error) }}</div>
    </div>
    <template v-else-if="collection">
      <h1 class="text-l weight-600 mb-5">New entry</h1>
      <EntryForm :project-id="id" :collection="collection" @saved="saved" />
    </template>
  </div>
</template>
