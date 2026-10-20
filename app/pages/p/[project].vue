<script setup lang="ts">
import CollectionPanel from '~/components/CollectionPanel.vue'
import ProjectSidebar from '~/components/ProjectSidebar.vue'

// Everything inside a project shares this frame: the sidebar stays put while the work beside it changes.
definePageMeta({ key: route => route.params.project as string })

const slug = useRoute().params.project as string
const { data: project, error } = await useProject(slug)
if (error.value) throw createError({ statusCode: 404, statusMessage: 'Project not found', fatal: true })
useLastProject().value = slug
useHead({ title: () => `${project.value?.name} · veritas` })

const { data: collections } = await useCollections(slug)
const editor = useCollectionEditor()
const editing = computed(() => collections.value.find(c => c.slug === editor.state.value.slug))
</script>

<template>
  <div v-if="project" class="shell desk-shell" data-fill>
    <ProjectSidebar :project="project" />
    <main class="workspace"><NuxtPage /></main>
    <CollectionPanel
      v-if="editor.state.value.open"
      :key="editor.state.value.slug ?? '+'"
      :project="slug"
      :collection="editing"
      @dismiss="editor.close()"
    />
  </div>
</template>
