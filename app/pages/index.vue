<script setup lang="ts">
// Home is the work, not a project picker: open the project used last, or the first one there is.
const last = useLastProject()
const projects = await useRequestFetch()('/api/admin/projects')
const target = projects.find(p => p.slug === last.value) ?? projects[0]
await navigateTo(target ? `/p/${target.slug}` : '/projects', { replace: true })
</script>

<template>
  <div />
</template>
