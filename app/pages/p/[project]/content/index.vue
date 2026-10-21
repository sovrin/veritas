<script setup lang="ts">
import { errorMessage } from '#nexitas/app/lib/format'
import type { ContentSpace } from '../../../../../shared/contracts'
import { deliveryPath } from '../../../../lib/fields'

// A project's content: its collections, and the token and address its sites read them with.
const project = useProject().id.value
useHead({ title: `${project} · Content · ${useRuntimeConfig().public.nexitas.name}` })
const { data: space, error, refresh } = await useFetch<ContentSpace>(`/api/p/${project}/content`)
useLive(refresh)
const origin = useRequestURL().origin
const snippet = computed(() =>
  space.value
    ? `curl -H "Authorization: Bearer ${space.value.token}" ${origin}${deliveryPath(project)}`
    : '',
)

const rotateOpen = ref(false)
const rotateError = ref('')
async function rotate() {
  rotateError.value = ''
  try {
    await $fetch(`/api/p/${project}/content/token`, { method: 'POST', body: {} })
    await refresh()
  } catch (cause) {
    rotateError.value = errorMessage(cause)
  }
}
</script>

<template>
  <div class="stack gap-5">
    <!-- The project exists (the core's /p/[project] saw to that), so a 404 means no content yet. -->
    <template v-if="error?.statusCode === 404">
      <h1 class="text-xl weight-600">Content</h1>
      <p class="text-muted">
        This project has no content yet. Start it on
        <NuxtLink :to="`/p/${project}`" class="link">the project's page</NuxtLink>.
      </p>
    </template>
    <div v-else-if="error" class="alert" data-tone="danger" role="alert">
      <div><strong>Could not load this project's content.</strong> {{ errorMessage(error) }}</div>
    </div>
    <template v-else-if="space">
      <div class="page-header">
        <h1 class="text-xl weight-600">{{ space.name }}</h1>
        <div class="cluster gap-2">
          <NuxtLink :to="`/p/${project}`" class="btn" data-size="s">Project</NuxtLink>
          <NuxtLink
            :to="`/p/${project}/content/_new`"
            class="btn"
            data-size="s"
            data-variant="primary"
            >Add a collection</NuxtLink
          >
        </div>
      </div>

      <!-- The collections take the room; how sites read them sits beside them. -->
      <div class="with-aside">
        <section class="stack gap-3 min-w-0" aria-labelledby="collections-title">
          <h2 id="collections-title" class="text-s weight-600 hairline-b pb-2">Collections</h2>
          <div v-if="space.collections.length" class="table-scroll">
            <table class="table" data-size="s">
              <thead>
                <tr>
                  <th scope="col">Collection</th>
                  <th scope="col" data-num>Published</th>
                  <th scope="col" data-num>Entries</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="collection in space.collections" :key="collection.slug">
                  <td>
                    <span class="stack gap-1 min-w-0">
                      <NuxtLink
                        :to="`/p/${project}/content/${collection.slug}`"
                        class="link weight-600 break-words"
                        >{{ collection.name }}</NuxtLink
                      >
                      <span class="font-mono text-xs text-muted">{{ collection.slug }}</span>
                    </span>
                  </td>
                  <td data-num>{{ collection.published }}</td>
                  <td data-num>{{ collection.entries }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="text-s text-muted">
            No collections yet. A collection is one kind of content, such as Posts or Pages.
          </p>
        </section>

        <aside class="stack gap-3" aria-labelledby="api-title">
          <h2 id="api-title" class="text-s weight-600 hairline-b pb-2">API</h2>
          <p class="text-s text-muted">
            Read-only, published entries only, from any origin. Every request needs the token.
          </p>
          <EmbedCode :code="snippet" caption="Shell" />
          <div class="cluster gap-2">
            <button
              type="button"
              class="btn"
              data-size="s"
              data-variant="ghost"
              data-tone="danger"
              @click="rotateOpen = true"
            >
              Replace the token
            </button>
          </div>
          <div v-if="rotateError" class="alert" data-tone="danger" role="alert">
            <div><strong>Could not replace the token.</strong> {{ rotateError }}</div>
          </div>
        </aside>
      </div>
    </template>

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
