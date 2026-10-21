<script setup lang="ts">
import { errorMessage } from '#nexitas/app/lib/format'
import type { Collection, Entry } from '../../../../../../shared/contracts'
const route = useRoute()
const project = useProject().id.value
const slug = route.params.collection as string
useHead({ title: `New entry · ${useRuntimeConfig().public.nexitas.name}` })
const { data: collection, error } = await useFetch<Collection>(
  `/api/p/${project}/content/collections/${slug}`,
)
const saved = (entry: Entry) => navigateTo(`/p/${project}/content/${slug}/${entry.slug}`)
</script>

<template>
  <div class="stack gap-5">
    <nav aria-label="Breadcrumb">
      <ol class="breadcrumb">
        <li><NuxtLink :to="`/p/${project}/content`">Content</NuxtLink></li>
        <li>
          <NuxtLink :to="`/p/${project}/content/${slug}`">{{ collection?.name ?? slug }}</NuxtLink>
        </li>
        <li aria-current="page">New entry</li>
      </ol>
    </nav>
    <div class="page-header">
      <h1 class="text-xl weight-600">New entry</h1>
    </div>
    <div v-if="error" class="alert" data-tone="danger" role="alert">
      <div><strong>Could not load this collection.</strong> {{ errorMessage(error) }}</div>
    </div>
    <EntryForm
      v-else-if="collection"
      :project-id="project"
      :collection="collection"
      @saved="saved"
    />
  </div>
</template>
