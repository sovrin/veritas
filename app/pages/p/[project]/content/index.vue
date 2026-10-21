<script setup lang="ts">
import { errorMessage } from '#nexitas/app/lib/format'
import type { ContentSpace } from '../../../../../shared/contracts'
import { deliveryPath } from '../../../../lib/fields'

// A project's content: its collections, and the token and address its sites read them with.
const project = useProject().id.value
const { data: space, error, refresh } = await useProjectFetch<ContentSpace>('/content')
// The project exists (the core's /p/[project] saw to that), so a 404 means no content yet.
const notStarted = computed(() => error.value?.statusCode === 404)
const origin = useRequestURL().origin
const snippet = computed(() =>
  space.value
    ? `curl -H "Authorization: Bearer ${space.value.token}" ${origin}${deliveryPath(project)}`
    : '',
)

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
  <AppPage
    title="Content"
    failed="Could not load this project's content."
    :error="notStarted ? undefined : error"
    :retry="refresh"
  >
    <template v-if="space" #actions>
      <NuxtLink :to="`/p/${project}/content/_new`" class="btn" data-size="s" data-variant="primary"
        >Add a collection</NuxtLink
      >
    </template>

    <EmptyState v-if="notStarted">
      This project has no content yet. Start it on
      <NuxtLink :to="`/p/${project}`" class="link">the project's page</NuxtLink>.
    </EmptyState>
    <!-- The collections take the room; how sites read them sits beside them. -->
    <AppSection v-else-if="space" title="Collections">
      <DataTable v-if="space.collections.length">
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
      </DataTable>
      <EmptyState v-else>
        No collections yet. A collection is one kind of content, such as Posts or Pages.
      </EmptyState>
    </AppSection>

    <template v-if="space" #aside>
      <AppSection title="API">
        <p class="text-s text-muted">
          Read-only, published entries only, from any origin. Every request needs the token.
        </p>
        <EmbedCode :code="snippet" />
        <div class="cluster gap-2">
          <DangerAction
            label="Replace the token"
            title="Replace the token?"
            confirm-label="Replace token"
            @confirm="rotate"
          >
            Sites and builds that read with the old one get a 401 until they use the new one.
          </DangerAction>
        </div>
        <AppAlert v-if="rotateError" title="Could not replace the token.">{{
          rotateError
        }}</AppAlert>
      </AppSection>
    </template>
  </AppPage>
</template>
