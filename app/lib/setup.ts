import type { ContentSpace } from '../../shared/contracts'
import { deliverySnippet } from './fields'

/** The content's setup, for the Setup inspector on its first page: the request its sites read it
 *  with, and replacing the token in it. */
export async function useContentSetup() {
  const project = useProject().id.value
  const { data: space, error, refresh } = await useProjectFetch<ContentSpace>('/content')
  const origin = useRequestURL().origin
  const snippet = computed(() =>
    space.value ? deliverySnippet(origin, project, space.value.token) : '',
  )
  const { pending: rotating, error: rotateError, submit } = useSubmit()
  const rotated = ref(false)
  async function rotate() {
    rotated.value = false
    const done = await submit(() =>
      $fetch(`/api/p/${project}/content/token`, { method: 'POST', body: {} }),
    )
    if (!done) return
    await refresh()
    rotated.value = true
  }
  return { space, error, refresh, snippet, rotate, rotating, rotateError, rotated }
}
