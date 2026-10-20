<script setup lang="ts">
import type { Collection, Entry } from '#shared/types/cms'
import EntryEditor from '~/components/EntryEditor.vue'

definePageMeta({ key: route => route.fullPath })

const props = defineProps<{ collection: Collection }>()
const { project, slug } = useRoute().params as Record<string, string>
const { data: entry, error } = await useFetch<Entry>(adminPath(project, 'collections', props.collection.slug, 'entries', slug))
if (error.value) throw createError({ statusCode: 404, statusMessage: 'Entry not found', fatal: true })
</script>

<template>
  <EntryEditor v-if="entry" :project="project" :collection="collection" :entry="entry" />
</template>
