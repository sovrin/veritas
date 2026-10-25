<script setup lang="ts">
import { useContentSetup } from '../../../../lib/setup'

// A project's content opens on its first collection: the collections are a switch on that page,
// not a level of their own. Here only what comes before one: content not started (started here),
// or no collection yet.
const project = useProject().id.value
const { space, error, refresh, snippet, rotate, rotating, rotateError, rotated } =
  await useContentSetup()
// The project exists (the core's /p/[project] saw to that), so a 404 means no content yet.
const notStarted = computed(() => error.value?.statusCode === 404)
const first = space.value?.collections[0]
if (first) await navigateTo(`/p/${project}/content/${first.slug}`, { replace: true })
const setup = useSetup()

async function start() {
  await $fetch(`/api/p/${project}/content`, { method: 'POST', body: {} })
  await refresh()
}
</script>

<template>
  <AppPage
    title="Content"
    failed="Could not load this project's content."
    :error="notStarted ? undefined : error"
    :retry="refresh"
    aside-title="Setup"
    :aside-close="setup.open.value ? setup.close.value : undefined"
  >
    <template v-if="space" #actions>
      <SetupLink />
      <NuxtLink :to="`/p/${project}/content/_new`" class="btn" data-size="s" data-variant="primary"
        >New collection</NuxtLink
      >
    </template>
    <ModuleStart
      v-if="notStarted"
      label="Start content"
      failed="Could not start its content."
      :start="start"
    >
      No content yet. Start, and you get collections to write in and a token to read them with.
    </ModuleStart>
    <EmptyState v-else-if="space">
      No collections yet. A collection is one kind of content, such as Posts or Pages.
    </EmptyState>

    <template v-if="space && setup.open.value" #aside>
      <p class="text-s text-muted">
        Read-only, published entries only, from any origin. Every request needs the token.
      </p>
      <EmbedCode :code="snippet" />
    </template>
    <template v-if="space && setup.open.value" #danger>
      <span>Replaces the token; whatever reads with the old one gets a 401.</span>
      <DangerAction
        label="Replace the token"
        title="Replace the token?"
        confirm-label="Replace token"
        :pending="rotating"
        @confirm="rotate"
      >
        Give every site and build the new one above.
      </DangerAction>
      <AppAlert v-if="rotated" class="w-full" tone="success" title="Replaced." />
      <AppAlert v-if="rotateError" class="w-full" title="Could not replace the token.">{{
        rotateError
      }}</AppAlert>
    </template>
  </AppPage>
</template>
