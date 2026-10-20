import { toast } from '@aequitas/aequitas.js'

export async function copy(text: string, what = 'Copied to clipboard.') {
  try {
    await navigator.clipboard.writeText(text)
    toast(what, { tone: 'success' })
  } catch {
    toast('Select the text and copy it manually.', { title: 'Could not copy.', tone: 'danger' })
  }
}
