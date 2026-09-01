<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
  }>(),
  { placeholder: '' }
)
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const el = ref<HTMLTextAreaElement>()

/** 按内容自适应高度：输入时实时展开，数据回填时也自动展开完整内容 */
function resize(): void {
  const ta = el.value
  if (!ta) return
  ta.style.height = 'auto'
  ta.style.height = `${Math.max(ta.scrollHeight, 48)}px`
}

function onInput(e: Event): void {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
  resize()
}

onMounted(resize)
watch(
  () => props.modelValue,
  () => {
    void nextTick(resize)
  }
)
</script>

<template>
  <textarea
    ref="el"
    class="auto-textarea"
    :value="modelValue"
    :placeholder="placeholder"
    @input="onInput"
  ></textarea>
</template>

<style scoped>
.auto-textarea {
  width: 100%;
  border: none;
  background: none;
  outline: none;
  color: var(--text);
  font-size: 13.5px;
  font-family: var(--font);
  line-height: 1.7;
  resize: none;
  overflow: hidden;
  min-height: 48px;
  padding: 0;
  display: block;
}
.auto-textarea::placeholder {
  color: var(--text-mute);
}
</style>
