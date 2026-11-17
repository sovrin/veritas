<script setup lang="ts">
import { mcpPath } from '#self/app/lib/fields'

/** <AssistantAccess :token="space.mcpToken" :refresh="refresh" />
 *  The Setup inspector's part on assistants: an assistant edits the content over MCP with a token
 *  of its own, which the owner turns on and off here. */
const props = defineProps<{ token: string | null; refresh: () => Promise<unknown> }>()
const project = useProject().id.value
const origin = useRequestURL().origin
const snippet = computed(() =>
  [
    `claude mcp add --transport http veritas \\`,
    `  ${origin}${mcpPath(project)} \\`,
    `  --header "Authorization: Bearer ${props.token ?? ''}"`,
  ].join('\n'),
)
const { pending, error, submit } = useSubmit()
const setAccess = (on: boolean) =>
  submit(async () => {
    await $fetch(`/api/p/${project}/content/mcp`, { method: 'POST', body: { on } })
    await props.refresh()
  })
</script>

<template>
  <AppSection title="Assistants">
    <template v-if="token">
      <p class="text-s text-muted">
        An assistant makes collections and writes entries over MCP with this token; what it writes
        stays a draft until you publish it.
      </p>
      <EmbedCode :code="snippet" />
      <p>
        <button
          type="button"
          class="link text-muted text-s"
          :disabled="pending"
          :aria-busy="pending || undefined"
          @click="setAccess(false)"
        >
          Turn off assistant access
        </button>
      </p>
    </template>
    <template v-else>
      <p class="text-s text-muted">
        Claude Code or another MCP client can make collections and write entries, with a token of
        its own.
      </p>
      <p>
        <button
          type="button"
          class="btn"
          data-size="s"
          :disabled="pending"
          :aria-busy="pending || undefined"
          @click="setAccess(true)"
        >
          Let an assistant edit the content
        </button>
      </p>
    </template>
    <AppAlert v-if="error" title="Could not change assistant access.">{{ error }}</AppAlert>
  </AppSection>
</template>
