<script setup lang="ts" generic="T extends string | number">
import { useId } from "vue";

/** <Segmented v-model="range" label="Range" :options="[{ value: 'day', label: 'Day' }, …]" />
 *  Radio inputs in a tinted track. State is rendered, not enhanced, so SSR paints it correctly. */
const model = defineModel<T>({ required: true });
const props = defineProps<{
  options: readonly { value: T; label: string; icon?: string }[];
  /** Accessible name of the group. */
  label: string;
  /** Show icons only; the label becomes a tooltip and the accessible name. */
  iconOnly?: boolean;
  name?: string;
}>();
const id = useId();
</script>

<template>
  <div class="segmented" role="radiogroup" :aria-label="props.label">
    <label
      v-for="o in props.options"
      :key="String(o.value)"
      :data-tip="props.iconOnly ? o.label : undefined"
    >
      <input
        v-model="model"
        type="radio"
        :name="props.name ?? id"
        :value="o.value"
        :aria-label="props.iconOnly ? o.label : undefined"
      />
      <span>
        <i v-if="o.icon" class="icon" :data-icon="o.icon" data-size="s"></i>
        <template v-if="!props.iconOnly">{{ o.label }}</template>
      </span>
    </label>
  </div>
</template>
