<script setup lang="ts">
import type { Collection } from '#shared/types/cms'
import SidePanel from '~/components/SidePanel.vue'

/** The collection as a site sees it: the real request, and the real response from the delivery API. */
const props = defineProps<{ project: string; collection: Collection }>()
defineEmits<{ dismiss: [] }>()

const { data: project } = await useProject(props.project)
const path = `/api/v1/${props.project}/${props.collection.slug}`
const url = `${useRequestURL().origin}${path}`
const curl = computed(() => `curl -H "Authorization: Bearer ${project.value?.token}" \\\n  ${url}`)

const response = ref<unknown>()
const failed = ref('')
onMounted(async () => {
  try {
    response.value = await $fetch(path, { headers: { Authorization: `Bearer ${project.value?.token}` } })
  } catch (e) {
    failed.value = problem(e)
  }
})
</script>

<template>
  <SidePanel aria-labelledby="api-heading" @dismiss="$emit('dismiss')">
    <div class="panel">
      <header class="panel-head">
        <div class="panel-title">
          <p class="eyebrow">{{ collection.name }}</p>
          <h2 id="api-heading">API preview</h2>
        </div>
        <button class="btn" type="button" data-icon data-variant="ghost" data-size="s" aria-label="Close" @click="$emit('dismiss')">
          <i class="icon" data-icon="x"></i>
        </button>
      </header>
      <div class="panel-body stack gap-4">
        <p class="text-s text-muted">Published entries only, newest first. Each is flat: slug, title, one key per field, updatedAt.</p>
        <figure class="code">
          <figcaption>
            Request
            <button class="btn" type="button" data-variant="ghost" data-size="s" @click="copy(curl, 'Command copied.')">
              <i class="icon" data-icon="copy"></i> Copy
            </button>
          </figcaption>
          <pre tabindex="0"><code>{{ curl }}</code></pre>
        </figure>
        <figure class="code">
          <figcaption>Response</figcaption>
          <p v-if="failed" class="error-text">{{ failed }}</p>
          <!-- eslint-disable-next-line vue/no-v-html -- escaped before it is marked up -->
          <pre v-else-if="response !== undefined" tabindex="0"><code v-html="highlightJson(response)"></code></pre>
          <pre v-else><code class="text-muted">Loading…</code></pre>
        </figure>
      </div>
    </div>
  </SidePanel>
</template>
