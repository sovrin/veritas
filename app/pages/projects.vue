<script setup lang="ts">
// Projects are set up rarely, so they live here, away from the daily work: open one, or add one.
const { data: projects } = await useProjects()
const last = useLastProject()

const name = ref('')
const slug = ref('')
const slugTouched = ref(false)
watch(name, (n) => { if (!slugTouched.value) slug.value = slugify(n) })
const error = ref('')
const busy = ref(false)

async function create() {
  error.value = ''
  busy.value = true
  try {
    const project = await $fetch('/api/admin/projects', { method: 'POST', body: { name: name.value, slug: slug.value } })
    await refreshNuxtData('projects')
    await navigateTo(`/p/${project.slug}`)
  } catch (e) {
    error.value = problem(e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="center">
    <div class="card stack gap-4 solo">
      <div class="cluster">
        <p class="brand"><i class="icon" data-icon="layers"></i> veritas</p>
        <NuxtLink v-if="last && projects.some(p => p.slug === last)" :to="`/p/${last}`" class="btn end" data-variant="ghost" data-size="s">
          <i class="icon" data-icon="arrow-left"></i> Back
        </NuxtLink>
      </div>

      <section v-if="projects.length" class="stack gap-2" aria-labelledby="projects-title">
        <h1 id="projects-title" class="heading">Projects</h1>
        <nav class="list" aria-labelledby="projects-title">
          <NuxtLink v-for="p in projects" :key="p.slug" :to="`/p/${p.slug}`">
            <span class="grow truncate">{{ p.name }}</span> <span class="caption mono">{{ p.slug }}</span>
          </NuxtLink>
        </nav>
      </section>

      <form class="stack gap-3" aria-labelledby="new-project-title" @submit.prevent="create">
        <div class="stack gap-1">
          <h2 id="new-project-title" class="heading">{{ projects.length ? 'New project' : 'Create your first project' }}</h2>
          <p class="text-s text-muted">One project per site or app. Each gets its own collections and API token.</p>
        </div>
        <div class="field">
          <label for="project-name" data-required>Name</label>
          <input id="project-name" v-model="name" class="input" placeholder="Marketing site" required :autofocus="!projects.length" />
        </div>
        <div class="field">
          <label for="project-slug" data-required>Slug</label>
          <input
            id="project-slug"
            v-model="slug"
            class="input mono"
            placeholder="marketing-site"
            required
            :pattern="SLUG.source"
            :aria-invalid="error ? 'true' : undefined"
            aria-describedby="project-slug-hint project-slug-error"
            @input="slugTouched = true"
          />
          <small id="project-slug-hint" class="truncate"><span class="mono">/api/v1/{{ slug || '…' }}</span> · can’t change later</small>
          <span id="project-slug-error" data-error>{{ error || 'Use a–z, 0–9 and dashes.' }}</span>
        </div>
        <button class="btn" data-variant="primary" type="submit" :aria-busy="busy || undefined">Create project</button>
      </form>
    </div>
  </main>
</template>
