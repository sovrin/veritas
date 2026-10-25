<script setup lang="ts">
import { formatAge, plural } from '#nexitas/app/lib/format'
import type { Collection, EntrySummary } from '../../shared/contracts'
import { deliveryPath } from '../lib/fields'
import { useContentSetup } from '../lib/setup'

/** <EntryList :selected="slug" :aside-name="slug" aside-mono><template #aside>…</template></EntryList>
 *  The content's page, one collection at a time: the project's collections as a switch, the
 *  collection's entries in the pane, their filter, search and page in the address. An entry's page
 *  renders it too, with `selected` marking its row and the entry in `aside` (the inspector), so
 *  writing entries never leaves the list. With no entry open, Setup opens the inspector on how sites
 *  read the content. */
defineProps<{ selected?: string; asideName?: string; asideMono?: boolean; asideTitle?: string }>()
const slots = defineSlots<{ aside?: () => unknown; danger?: () => unknown }>()

const PAGE_SIZE = 50
const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'drafts', label: 'Drafts' },
  { value: 'published', label: 'Published' },
] as const
type Filter = (typeof FILTERS)[number]['value']

const route = useRoute()
const project = useProject().id.value
const slug = route.params.collection as string
// A key of its own: the entry beside it reads the same address, not live, for its form.
const {
  data: collection,
  error,
  refresh,
} = await useProjectFetch<Collection & { entries: EntrySummary[] }>(
  `/content/collections/${slug}`,
  { key: `veritas-entries-${project}-${slug}` },
)

// The project's collections for the switch, and its setup (the token sites read it with), which
// the inspector shows on demand while no entry is open.
const { space, snippet, rotate, rotating, rotateError, rotated } = await useContentSetup()
const setup = useSetup()
const setupOpen = computed(() => !slots.aside && setup.open.value)

const filter = computed<Filter>(() =>
  route.query.state === 'drafts' || route.query.state === 'published' ? route.query.state : 'all',
)
const q = computed(() => (typeof route.query.q === 'string' ? route.query.q.trim() : ''))
const page = computed(() => Math.max(1, Number(route.query.page) || 1))

/** The list's address for a filter, search or page, leaving out the defaults. Anything new starts
 *  on the first page. */
function within(next: { state?: Filter; q?: string; page?: number }) {
  const query = { state: filter.value, q: q.value, page: 1, ...next }
  return {
    path: `/p/${project}/content/${slug}`,
    query: {
      ...(query.state !== 'all' ? { state: query.state } : {}),
      ...(query.q ? { q: query.q } : {}),
      ...(query.page > 1 ? { page: String(query.page) } : {}),
    },
  }
}

// The field follows the address (back button), and searches on Enter or clear.
const searchText = ref(q.value)
watch(q, (value) => (searchText.value = value))
const search = () => navigateTo(within({ q: searchText.value.trim() }))

// Drafts first, since they wait on the owner, then newest first. The API sends them all at once,
// so filtering, search and paging happen here.
const all = computed(() =>
  (collection.value?.entries ?? []).toSorted(
    (a, b) => Number(a.published) - Number(b.published) || b.updatedAt - a.updatedAt,
  ),
)
const drafts = computed(() => all.value.filter((entry) => !entry.published).length)
const counts = computed((): Record<Filter, number> => ({
  all: all.value.length,
  drafts: drafts.value,
  published: all.value.length - drafts.value,
}))
const shown = computed(() => {
  const needle = q.value.toLowerCase()
  return all.value.filter(
    (entry) =>
      (filter.value === 'all' || entry.published === (filter.value === 'published')) &&
      (!needle ||
        entry.title.toLowerCase().includes(needle) ||
        entry.slug.toLowerCase().includes(needle)),
  )
})
const pageEntries = computed(() =>
  shown.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE),
)
// The same words as the content's overview.
const headline = computed(() => {
  if (!all.value.length) return 'No entries yet'
  return drafts.value ? `${plural(drafts.value, 'draft')} waiting` : 'Everything is published'
})
</script>

<template>
  <AppPage
    title="Content"
    failed="Could not load this collection."
    :error="error"
    :retry="refresh"
    :aside-title="slots.aside ? asideTitle : 'Setup'"
    :aside-name="asideName"
    :aside-mono="asideMono"
    :aside-close="
      slots.aside
        ? { path: `/p/${project}/content/${slug}`, query: route.query }
        : setupOpen
          ? setup.close.value
          : undefined
    "
  >
    <template v-if="collection" #actions>
      <SetupLink v-if="!slots.aside" />
      <NuxtLink :to="`/p/${project}/content/_new`" class="btn" data-size="s"
        >New collection</NuxtLink
      >
      <NuxtLink :to="`/p/${project}/content/${slug}/_settings`" class="btn" data-size="s"
        >Settings</NuxtLink
      >
      <!-- The inspector's form holds the view's one primary while it is open. -->
      <NuxtLink
        :to="{ path: `/p/${project}/content/${slug}/_new`, query: route.query }"
        class="btn"
        data-size="s"
        :data-variant="slots.aside ? undefined : 'primary'"
        >New entry</NuxtLink
      >
    </template>
    <template v-if="collection" #lead>
      <AppLead :title="headline">
        <template #meta
          ><span class="font-mono">{{ deliveryPath(project, slug) }}</span></template
        >
      </AppLead>
    </template>
    <template v-if="all.length || (space?.collections.length ?? 0) > 1" #filters>
      <!-- The two switches read as one group, the search apart from them. -->
      <div class="cluster gap-5">
        <!-- Which collection: a switch, shown once there is more than one to switch between. -->
        <FilterLinks
          v-if="(space?.collections.length ?? 0) > 1"
          label="Collection"
          :options="
            space!.collections.map((other) => ({
              label: other.name,
              to: `/p/${project}/content/${other.slug}`,
              current: other.slug === slug,
            }))
          "
        />
        <FilterLinks
          v-if="all.length"
          label="Show"
          :options="
            FILTERS.map((option) => ({
              label: `${option.label} ${counts[option.value]}`,
              to: within({ state: option.value }),
              current: filter === option.value,
            }))
          "
        />
      </div>
      <SearchBox
        v-if="all.length"
        v-model="searchText"
        label="Search entries: a title or slug"
        @search="search"
      />
    </template>

    <template v-if="collection">
      <div v-if="pageEntries.length" class="stack gap-6">
        <DataTable label="Entries">
          <thead>
            <tr>
              <th scope="col">Entry</th>
              <th scope="col">State</th>
              <th scope="col" data-num>Saved</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="entry in pageEntries"
              :key="entry.slug"
              :aria-selected="entry.slug === selected ? 'true' : undefined"
            >
              <td>
                <span class="stack gap-1 min-w-0">
                  <!-- A draft recedes to muted; what the API delivers stands in full ink. -->
                  <NuxtLink
                    :to="{
                      path: `/p/${project}/content/${slug}/${entry.slug}`,
                      query: route.query,
                    }"
                    class="link break-words"
                    :class="entry.published ? 'weight-600' : 'text-muted'"
                    >{{ entry.title }}</NuxtLink
                  >
                  <span class="font-mono text-xs text-muted">{{ entry.slug }}</span>
                </span>
              </td>
              <td class="text-s">
                <StateDot :tone="entry.published ? 'success' : undefined">{{
                  entry.published ? 'published' : 'draft'
                }}</StateDot>
              </td>
              <td data-num class="text-muted">
                <time>{{ formatAge(entry.updatedAt) }}</time>
              </td>
            </tr>
          </tbody>
        </DataTable>
        <PagerNav
          :page="page"
          :page-size="PAGE_SIZE"
          :total="shown.length"
          :to="(next) => within({ page: next })"
        />
      </div>
      <EmptyState v-else-if="!all.length"
        >New entries stay drafts until you publish them.</EmptyState
      >
      <EmptyState v-else-if="q">Nothing matches “{{ q }}” here.</EmptyState>
      <EmptyState v-else>Nothing here.</EmptyState>
    </template>

    <template v-if="slots.aside" #aside><slot name="aside" /></template>
    <template v-else-if="space && setupOpen" #aside>
      <p class="text-s text-muted">
        Read-only, published entries only, from any origin. Every request needs the token.
      </p>
      <EmbedCode :code="snippet" />
    </template>
    <template v-if="slots.danger" #danger><slot name="danger" /></template>
    <template v-else-if="space && setupOpen" #danger>
      <span>Replaces the token; whatever reads with the old one gets a 401.</span>
      <DangerAction
        label="Replace the token"
        title="Replace the token?"
        confirm-label="Replace token"
        :pending="rotating"
        @confirm="rotate"
      >
        Give every site and build the new one above.
      </DangerAction>
      <AppAlert v-if="rotated" class="w-full" tone="success" title="Replaced." />
      <AppAlert v-if="rotateError" class="w-full" title="Could not replace the token.">{{
        rotateError
      }}</AppAlert>
    </template>
  </AppPage>
</template>
