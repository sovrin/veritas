<script setup lang="ts">
import { toast } from '@aequitas/aequitas.js'

// For whoever connects a site to this project: where the API is, the token it needs, and the project's own settings.
const slug = useRoute().params.project as string
const base = adminPath(slug)
const { data: project } = await useProject(slug)
const { data: collections } = await useCollections(slug)
const total = computed(() => collections.value.reduce((n, c) => n + c.entries, 0))

const apiBase = `${useRequestURL().origin}/api/v1/${slug}`
const example = computed(() =>
  `curl -H "Authorization: Bearer ${project.value?.token}" \\\n  ${apiBase}/${collections.value[0]?.slug ?? 'posts'}`)

const name = ref(project.value?.name ?? '')
const error = ref('')
const renaming = ref(false)
const rotating = ref(false)

async function rename() {
  error.value = ''
  renaming.value = true
  try {
    project.value = await $fetch(base, { method: 'PATCH', body: { name: name.value } })
    await refreshNuxtData('projects')
    toast('Project renamed.', { tone: 'success' })
  } catch (e) {
    error.value = problem(e)
  } finally {
    renaming.value = false
  }
}

// Actions outside a form report back in a toast, like copying does.
async function rotate() {
  if (!confirm('Replace the token? Every site using the current one stops getting content until it uses the new one.')) return
  rotating.value = true
  try {
    project.value = await $fetch(base, { method: 'PATCH', body: { rotateToken: true } })
    toast('Token replaced.', { tone: 'success' })
  } catch (e) {
    toast(problem(e), { title: 'Could not replace the token.', tone: 'danger' })
  } finally {
    rotating.value = false
  }
}

async function remove() {
  if (!confirm(`Delete ${project.value?.name}, its ${collections.value.length} collections and ${total.value} entries? This can’t be undone.`)) return
  try {
    await $fetch(base, { method: 'DELETE' })
    useLastProject().value = undefined
    await refreshNuxtData('projects')
    toast(`${project.value?.name} deleted.`, { tone: 'success' })
    await navigateTo('/')
  } catch (e) {
    toast(problem(e), { title: 'Could not delete the project.', tone: 'danger' })
  }
}
</script>

<template>
  <div v-if="project" class="pane">
    <header class="pane-bar"><h1 class="heading">API &amp; settings</h1></header>

    <div class="pane-body">
      <section class="pane-section" aria-labelledby="api-title">
        <div>
          <h2 id="api-title" class="heading">API</h2>
          <p class="text-s text-muted">Read-only, published entries only. Send the token with every request.</p>
        </div>
        <dl class="properties">
          <dt>Base URL</dt>
          <dd class="mono">{{ apiBase }}</dd>
          <dt>Token</dt>
          <dd class="cluster gap-2">
            <code class="token">{{ project.token }}</code>
            <button class="btn" type="button" data-variant="ghost" data-size="s" @click="copy(project.token, 'Token copied.')">
              <i class="icon" data-icon="copy"></i> Copy
            </button>
            <button class="btn" type="button" data-variant="ghost" data-size="s" :aria-busy="rotating || undefined" @click="rotate">
              <i class="icon" data-icon="refresh"></i> Replace
            </button>
          </dd>
          <dt>Endpoints</dt>
          <dd>
            <ul data-variant="plain" class="mono">
              <li>GET /<span class="text-muted"> · project and collections</span></li>
              <li>GET /:collection<span class="text-muted"> · published entries</span></li>
              <li>GET /:collection/:slug<span class="text-muted"> · one entry</span></li>
            </ul>
          </dd>
        </dl>
        <figure class="code">
          <figcaption>
            Try it
            <button class="btn" type="button" data-variant="ghost" data-size="s" @click="copy(example, 'Command copied.')">
              <i class="icon" data-icon="copy"></i> Copy
            </button>
          </figcaption>
          <pre tabindex="0"><code>{{ example }}</code></pre>
        </figure>
      </section>

      <form class="pane-section" aria-labelledby="general-title" @submit.prevent="rename">
        <h2 id="general-title" class="heading">Project</h2>
        <div class="field">
          <label for="project-name" data-required>Name</label>
          <input
            id="project-name"
            v-model="name"
            class="input"
            required
            :aria-invalid="error ? 'true' : undefined"
            aria-describedby="project-name-hint project-name-error"
            @input="error = ''"
          />
          <small id="project-name-hint">The slug <code>{{ project.slug }}</code> stays as it is.</small>
          <span id="project-name-error" data-error>{{ error || 'Enter a name.' }}</span>
        </div>
        <div>
          <button class="btn" type="submit" :disabled="!name.trim() || name === project.name" :aria-busy="renaming || undefined">Rename</button>
        </div>
      </form>

      <section class="pane-section pane-row" aria-labelledby="delete-title">
        <div>
          <h2 id="delete-title" class="heading">Delete project</h2>
          <p class="text-s text-muted">Removes {{ project.name }} with all its collections, entries and its token.</p>
        </div>
        <button class="btn" type="button" data-variant="ghost" data-tone="danger" @click="remove">
          <i class="icon" data-icon="trash"></i> Delete project
        </button>
      </section>
    </div>
  </div>
</template>
