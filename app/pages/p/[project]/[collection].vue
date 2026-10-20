<script setup lang="ts">
import ApiPreview from '~/components/ApiPreview.vue'

// One collection as a table: every entry a row, every field a column. Opening an entry slides the editor in over it.
definePageMeta({ key: route => `${route.params.project}/${route.params.collection}` })

const route = useRoute()
const project = route.params.project as string
const slug = route.params.collection as string
const { data: collections } = await useCollections(project)
const collection = computed(() => collections.value.find(c => c.slug === slug))
if (!collection.value) throw createError({ statusCode: 404, statusMessage: 'Collection not found', fatal: true })
const { data: entries } = await useEntries(project, slug)

const query = ref('')
const shown = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? entries.value.filter(e => e.title.toLowerCase().includes(q) || e.slug.includes(q)) : entries.value
})
const published = computed(() => entries.value.filter(e => e.published).length)

const editor = useCollectionEditor()
const preview = ref(false)
const open = (entry: string) => navigateTo(`/p/${project}/${slug}/${entry}`)
</script>

<template>
  <div v-if="collection" class="pane">
    <header class="pane-bar">
      <h1 class="heading truncate">{{ collection.name }}</h1>
      <button class="btn" data-icon data-variant="ghost" data-size="s" aria-label="Edit fields" title="Edit fields" @click="editor.open(slug)">
        <i class="icon" data-icon="settings-gear"></i>
      </button>
      <div class="pane-actions">
        <button class="btn" data-size="s" type="button" @click="preview = true"><i class="icon" data-icon="code"></i> API preview</button>
        <NuxtLink :to="`/p/${project}/${slug}/_new`" class="btn" data-variant="primary" data-size="s">
          <i class="icon" data-icon="plus"></i> New entry
        </NuxtLink>
      </div>
    </header>

    <div class="pane-body pane-flush">
      <div v-if="entries.length" class="pane-search">
        <div class="input-group">
          <span><i class="icon" data-icon="search"></i></span>
          <input v-model="query" class="input" type="search" placeholder="Search by title or slug" aria-label="Search entries" />
        </div>
      </div>

      <div v-if="shown.length" class="table-scroll">
        <table class="table entries-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th v-for="f in collection.fields" :key="f.key">
                <span class="th-field"><i class="icon" :data-icon="FIELD_META[f.type].icon" data-size="s"></i> {{ f.label }}</span>
              </th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="e in shown"
              :key="e.slug"
              :aria-selected="route.params.slug === e.slug || undefined"
              @click="open(e.slug)"
            >
              <td>
                <NuxtLink :to="`/p/${project}/${slug}/${e.slug}`" class="row-link" @click.stop>{{ e.title }}</NuxtLink>
                <div class="caption mono">{{ e.slug }}</div>
              </td>
              <td>
                <span class="badge" data-dot :data-tone="e.published ? 'success' : undefined">{{ e.published ? 'Published' : 'Draft' }}</span>
              </td>
              <td v-for="f in collection.fields" :key="f.key" :data-num="f.type === 'number' || undefined">
                <span v-if="cell(f.type, e.fields[f.key])" class="cell" :data-type="f.type">{{ cell(f.type, e.fields[f.key]) }}</span>
                <span v-else class="text-muted">—</span>
              </td>
              <td class="nowrap text-muted"><time :datetime="e.updatedAt">{{ short(e.updatedAt) }}</time></td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-else-if="query" class="pane-note">Nothing in {{ collection.name }} matches “{{ query }}”.</p>

      <div v-else class="empty start">
        <i class="icon" data-icon="file-text" data-size="l"></i>
        <h4>{{ collection.name }} has no entries yet</h4>
        <p>New entries stay drafts until you publish them.</p>
        <NuxtLink :to="`/p/${project}/${slug}/_new`" class="btn" data-variant="primary" data-size="s">
          <i class="icon" data-icon="plus"></i> New entry
        </NuxtLink>
      </div>
    </div>

    <footer class="statusbar">
      <span class="tabular">{{ entries.length }} {{ entries.length === 1 ? 'entry' : 'entries' }}</span>
      <span class="tabular">{{ published }} published</span>
      <span class="end mono hide-s">/api/v1/{{ project }}/{{ slug }}</span>
    </footer>

    <NuxtPage :collection="collection" />
    <ApiPreview v-if="preview" :project="project" :collection="collection" @dismiss="preview = false" />
  </div>
</template>
