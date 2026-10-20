<script setup lang="ts">
import type { Project } from '#shared/types/cms'
import ThemeSwitch from '~/components/ae/ThemeSwitch.vue'

/** The project at the top, its collections below, settings and the way out at the bottom. */
const props = defineProps<{ project: Project }>()

const route = useRoute()
const theme = useThemeMode()
const admin = useAdmin()
const { data: projects } = await useProjects()
const { data: collections } = await useCollections(props.project.slug)
const editor = useCollectionEditor()
const base = `/p/${props.project.slug}`

const menu = ref<HTMLElement>()
async function go(path: string) {
  menu.value?.hidePopover()
  await navigateTo(path)
}

async function signOut() {
  await $fetch('/api/session', { method: 'DELETE' })
  admin.value = false
  clearNuxtData()
  await navigateTo('/login')
}
</script>

<template>
  <nav class="sidebar" aria-label="Project">
    <button class="project-switch" popovertarget="project-menu" aria-label="Switch project">
      <span class="project-mark" aria-hidden="true">{{ project.name.slice(0, 1).toUpperCase() }}</span>
      <span class="truncate">{{ project.name }}</span>
      <i class="icon end" data-icon="chevron-down" data-size="s"></i>
    </button>
    <div id="project-menu" ref="menu" class="menu" popover>
      <h6>Switch project</h6>
      <button v-for="p in projects" :key="p.slug" :aria-pressed="p.slug === project.slug" @click="go(`/p/${p.slug}`)">
        {{ p.name }}
      </button>
      <hr />
      <button @click="go('/projects')"><i class="icon" data-icon="folders"></i> All projects</button>
    </div>

    <h6>Collections</h6>
    <NuxtLink
      v-for="c in collections"
      :key="c.slug"
      :to="`${base}/${c.slug}`"
      :aria-current="route.params.collection === c.slug ? 'page' : undefined"
    >
      <i class="icon" data-icon="folder"></i><span class="truncate">{{ c.name }}</span>
      <span class="end caption tabular">{{ c.entries }}</span>
    </NuxtLink>
    <button class="btn new-collection" data-variant="ghost" data-size="s" @click="editor.open()">
      <i class="icon" data-icon="plus"></i> New collection
    </button>

    <footer class="stack gap-2">
      <NuxtLink :to="`${base}/_settings`" :aria-current="route.path === `${base}/_settings` ? 'page' : undefined">
        <i class="icon" data-icon="api"></i><span>API &amp; settings</span>
      </NuxtLink>
      <div class="cluster">
        <ThemeSwitch v-model="theme" />
        <button class="btn end" data-icon data-variant="ghost" data-size="s" aria-label="Sign out" title="Sign out" @click="signOut">
          <i class="icon" data-icon="log-out"></i>
        </button>
      </div>
    </footer>
  </nav>
</template>
