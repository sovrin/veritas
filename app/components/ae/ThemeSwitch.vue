<script setup lang="ts">
import { setTheme } from "@aequitas/aequitas.js";
import Segmented from "./Segmented.vue";

/** <ThemeSwitch v-model="theme" />
 *  Pass the server-known mode (the `ae-theme` cookie) so the switch paints in its final state.
 *  Changing it calls setTheme(), which updates <html data-theme>, localStorage and the cookie. */
type Mode = "light" | "dark" | "auto";

const mode = defineModel<Mode>({ default: "auto" });

const OPTIONS = [
  { value: "light", label: "Light", icon: "sun" },
  { value: "auto", label: "System", icon: "contrast" },
  { value: "dark", label: "Dark", icon: "moon" },
] as const;

function change(next: Mode) {
  mode.value = next;
  setTheme(next);
}
</script>

<template>
  <Segmented
    :model-value="mode"
    :options="OPTIONS"
    label="Theme"
    icon-only
    @update:model-value="change"
  />
</template>
