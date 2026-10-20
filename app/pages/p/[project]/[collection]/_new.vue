<script setup lang="ts">
import type { Collection } from '#shared/types/cms'
import EntryEditor from '~/components/EntryEditor.vue'

defineProps<{ collection: Collection }>()
const project = useRoute().params.project as string
</script>

<template>
  <EntryEditor :project="project" :collection="collection" />
</template>
