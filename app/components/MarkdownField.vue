<script setup lang="ts">
import type { StoredFile } from '#nexitas/shared/capabilities'
import { deliveredFile } from '../../shared/contracts'
import type { MarkdownEdit } from '../lib/markdown'
import { image, link, pasteUrl, prefixLines, renderPreview, wrap } from '../lib/markdown'

/** A Markdown field: the textarea, a toolbar that writes the Markdown for you, and a preview. */
const props = defineProps<{ id: string }>()
const text = defineModel<string>({ required: true })

const area = useTemplateRef('area')
const previewing = ref(false)
const preview = computed(() => (previewing.value ? renderPreview(text.value) : ''))

function apply(make: (text: string, start: number, end: number) => MarkdownEdit) {
  const el = area.value
  if (!el) return
  const edit = make(el.value, el.selectionStart, el.selectionEnd)
  el.focus()
  el.setSelectionRange(edit.from, edit.to)
  // insertText keeps the browser's undo; where it is gone, the edit still lands, without undo.
  if (!document.execCommand('insertText', false, edit.insert)) {
    el.setRangeText(edit.insert)
    text.value = el.value
  }
  el.setSelectionRange(edit.start, edit.end)
}

const tools = [
  {
    label: 'Bold',
    icon: 'bold',
    key: 'b',
    run: (t: string, s: number, e: number) => wrap(t, s, e, '**'),
  },
  {
    label: 'Italic',
    icon: 'italic',
    key: 'i',
    run: (t: string, s: number, e: number) => wrap(t, s, e, '_'),
  },
  { label: 'Link', icon: 'link', key: 'k', run: link },
  {
    label: 'Heading',
    icon: 'heading',
    run: (t: string, s: number, e: number) => prefixLines(t, s, e, '## '),
  },
  {
    label: 'List',
    icon: 'list',
    run: (t: string, s: number, e: number) => prefixLines(t, s, e, '- '),
  },
  {
    label: 'Quote',
    icon: 'quote',
    run: (t: string, s: number, e: number) => prefixLines(t, s, e, '> '),
  },
  { label: 'Code', icon: 'code', run: (t: string, s: number, e: number) => wrap(t, s, e, '`') },
]
const isMac = import.meta.client && /Mac|iP/.test(navigator.platform)
const shortcut = (key?: string) => (key ? ` (${isMac ? '⌘' : 'Ctrl+'}${key.toUpperCase()})` : '')

function onKeydown(event: KeyboardEvent) {
  if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return
  const tool = tools.find((t) => t.key === event.key.toLowerCase())
  if (!tool) return
  event.preventDefault()
  apply(tool.run)
}

// A URL pasted over selected words links them, or shows one of the project's files as an image.
function onPaste(event: ClipboardEvent) {
  const el = area.value
  const pasted = event.clipboardData?.getData('text/plain')
  if (!el || !pasted) return
  const edit = pasteUrl(el.value, el.selectionStart, el.selectionEnd, pasted, `${origin}/v1/files/`)
  if (!edit) return
  event.preventDefault()
  apply(() => edit)
}

// An image comes from whichever module provides files: picked or uploaded in its picker, it
// lands at the cursor as Markdown, and the picker closes.
const filesOn = useCapability('files')
const picking = ref(false)
const pickedId = ref<string | null>(null)
const origin = useRequestURL().origin
function insertImage(file: StoredFile | null) {
  if (!file || file.id !== pickedId.value) return
  const { url } = deliveredFile(origin, file)
  apply((_t, s, e) => image(s, e, file.name, url))
  pickedId.value = null
  picking.value = false
}
</script>

<template>
  <div class="stack gap-2">
    <div class="toolbar" role="group" aria-label="Formatting">
      <button
        v-for="tool in tools"
        :key="tool.label"
        type="button"
        class="btn"
        data-icon
        :aria-label="tool.label + shortcut(tool.key)"
        :data-tip="tool.label + shortcut(tool.key)"
        :disabled="previewing"
        @click="apply(tool.run)"
      >
        <i class="icon" :data-icon="tool.icon" aria-hidden="true"></i>
      </button>
      <template v-if="filesOn">
        <hr />
        <button
          type="button"
          class="btn"
          data-icon
          aria-label="Image"
          data-tip="Image"
          :aria-pressed="picking"
          :disabled="previewing"
          @click="picking = !picking"
        >
          <i class="icon" data-icon="image" aria-hidden="true"></i>
        </button>
      </template>
      <hr />
      <button
        type="button"
        class="btn"
        data-icon
        aria-label="Preview"
        data-tip="Preview"
        :aria-pressed="previewing"
        @click="previewing = !previewing"
      >
        <i class="icon" data-icon="eye" aria-hidden="true"></i>
      </button>
    </div>
    <component
      :is="'FilesPicker'"
      v-if="picking && !previewing"
      v-model="pickedId"
      accept="image"
      aria-label="Image to insert"
      @picked="insertImage"
    />
    <textarea
      v-show="!previewing"
      :id="props.id"
      ref="area"
      v-model="text"
      data-size="s"
      class="input font-mono text-s"
      rows="10"
      @keydown="onKeydown"
      @paste="onPaste"
    ></textarea>
    <!-- renderPreview leaves out raw HTML and script addresses (app/lib/markdown.ts). -->
    <div v-if="previewing" class="prose hairline p-4" v-html="preview"></div>
  </div>
</template>
