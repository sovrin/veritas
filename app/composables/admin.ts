/** Whether this browser holds an admin session. Undefined until the route guard has asked the server. */
export const useAdmin = () => useState<boolean | undefined>('admin', () => undefined)

/** Admin API path for a project, or something inside it. */
export const adminPath = (project: string, ...rest: string[]) => ['/api/admin/projects', project, ...rest].join('/')

// Shared, keyed fetches: every component asking for the same thing gets the same data.
// After a change, refresh with refreshNuxtData('<key>').

export const useProjects = () =>
  useFetch('/api/admin/projects', { key: 'projects', default: () => [] })

export const useProject = (project: string) =>
  useFetch(adminPath(project), { key: `project:${project}` })

export const useCollections = (project: string) =>
  useFetch(adminPath(project, 'collections'), { key: `collections:${project}`, default: () => [] })

export const useEntries = (project: string, collection: string) =>
  useFetch(adminPath(project, 'collections', collection, 'entries'), { key: `entries:${project}:${collection}`, default: () => [] })

/** The project the home screen opens: the one used last. */
export const useLastProject = () =>
  useCookie<string | undefined>('veritas-project', { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })

/** The collection panel: closed, open for a new collection, or open on an existing one. The project frame renders it. */
export function useCollectionEditor() {
  const state = useState<{ open: boolean; slug?: string }>('collection-editor', () => ({ open: false }))
  return {
    state,
    open: (slug?: string) => { state.value = { open: true, slug } },
    close: () => { state.value = { open: false } },
  }
}
