<script setup lang="ts">
import { errorMessage } from '#nexitas/app/lib/format'
import type { ContentSpace } from '../../../../shared/contracts'
import { deliveryPath } from '../../../lib/fields'

// A project's content: its collections, and the token and address its sites read them with.
const id = useRoute().params.project as string
useHead({ title: `${id} · Content · ${useRuntimeConfig().public.nexitas.name}` })
const { data: space, error, refresh } = await useFetch<ContentSpace>(`/api/content/${id}`)
useLive(refresh)
const origin = useRequestURL().origin
const snippet = computed(() =>
  space.value
    ? `curl -H "Authorization: Bearer ${space.value.token}" ${origin}${deliveryPath(id)}`
    : '',
)

const rotateOpen = ref(false)
const rotateError = ref('')
async function rotate() {
  rotateError.value = ''
  try {
    await $fetch(`/api/content/${id}/token`, { method: 'POST', body: {} })
    await refresh()
  } catch (cause) {
    rotateError.value = errorMessage(cause)
  }
}
</script>

<template>
  <div>
    <nav aria-label="Breadcrumb" class="mb-5">
      <ol class="breadcrumb">
        <li><NuxtLink to="/content">Content</NuxtLink></li>
        <li aria-current="page" class="font-mono">{{ id }}</li>
      </ol>
    </nav>

    <div v-if="error" class="alert" data-tone="danger" role="alert">
      <div><strong>Could not load this project's content.</strong> {{ errorMessage(error) }}</div>
    </div>
    <div v-else-if="space" class="stack gap-6">
      <div class="cluster justify-between gap-4">
        <h1 class="text-l weight-600">{{ space.name }}</h1>
        <NuxtLink :to="`/projects/${id}`" class="link text-s">Project</NuxtLink>
      </div>

      <section class="stack gap-3" aria-labelledby="collections-title">
        <h2 id="collections-title" class="text-s weight-600">Collections</h2>
        <ul v-if="space.collections.length" data-variant="plain" aria-label="Collections">
          <li
            v-for="collection in space.collections"
            :key="collection.slug"
            class="py-3 hairline-b"
          >
            <div class="cluster gap-3 flex-nowrap">
              <NuxtLink
                :to="`/content/${id}/${collection.slug}`"
                class="link weight-600 flex-1 min-w-0 break-words"
                data-quiet
                >{{ collection.name }}</NuxtLink
              >
              <span class="text-s text-muted tabular"
                >{{ collection.published }} of {{ collection.entries }} published</span
              >
            </div>
            <p class="font-mono text-xs text-muted">{{ collection.slug }}</p>
          </li>
        </ul>
        <p v-else class="text-s text-muted">
          No collections yet. A collection is one kind of content, such as Posts or Pages.
        </p>
        <p><NuxtLink :to="`/content/${id}/_new`" class="link">Add a collection</NuxtLink></p>
      </section>

      <section class="stack gap-3 hairline-t pt-5" aria-labelledby="api-title">
        <h2 id="api-title" class="text-s weight-600">API</h2>
        <p class="text-s text-muted">
          Read-only, published entries only, from any origin. Every request needs the token.
        </p>
        <EmbedCode :code="snippet" caption="Shell" />
        <p>
          <button type="button" class="link text-s" @click="rotateOpen = true">
            Replace the token
          </button>
        </p>
        <div v-if="rotateError" class="alert" data-tone="danger" role="alert">
          <div><strong>Could not replace the token.</strong> {{ rotateError }}</div>
        </div>
      </section>
    </div>

    <ConfirmDialog
      v-model:open="rotateOpen"
      title="Replace the token?"
      confirm-label="Replace token"
      tone="danger"
      @confirm="rotate"
    >
      <template #description
        >Sites and builds that read with the old one get a 401 until they use the new one.</template
      >
    </ConfirmDialog>
  </div>
</template>
