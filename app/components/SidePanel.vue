<script setup lang="ts">
/** A modal panel from the end edge, open for as long as it is mounted. It never closes itself: Esc, a click beside it
 *  and its close button all emit `dismiss`, and the owner decides (and can ask about unsaved changes first). */
const emit = defineEmits<{ dismiss: [] }>()
const el = ref<HTMLDialogElement>()
onMounted(() => el.value?.showModal())

function onClick(e: MouseEvent) {
  if (e.target === el.value) emit('dismiss')
}
</script>

<template>
  <dialog ref="el" class="drawer side-panel" @cancel.prevent="emit('dismiss')" @click="onClick">
    <slot />
  </dialog>
</template>
