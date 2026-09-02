<template>
  <div ref="wrapRef" class="his-combo">
    <input
      ref="inputRef"
      class="combo-input"
      :value="modelValue"
      :placeholder="placeholder"
      @input="onInput(($event.target as HTMLInputElement).value)"
      @focus="positionPanel(); open = true"
      @click="positionPanel(); open = true"
      @keydown.escape="open = false"
    />
    <Teleport to="body">
      <Transition name="fade-up">
        <div v-if="open && filtered.length > 0" ref="panelRef" class="combo-panel" :style="panelStyle">
          <div
            v-for="o in filtered"
            :key="o.value"
            class="combo-item"
            @mousedown.prevent="pick(o)"
          >
            <span class="combo-code">{{ o.value }}</span>
            <span class="combo-label">{{ o.label }}</span>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

export interface ComboboxOption {
  value: string
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    options: ComboboxOption[]
    placeholder?: string
  }>(),
  { placeholder: '请输入' }
)
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const open = ref(false)
const wrapRef = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement>()
const panelRef = ref<HTMLElement>()

/** 面板 Teleport 到 body 后按触发器位置 fixed 定位，避免被卡片 overflow 裁剪 */
const panelStyle = ref<{ top: string; left: string; width: string }>({
  top: '0px',
  left: '0px',
  width: '0px'
})

function positionPanel(): void {
  const rect = wrapRef.value?.getBoundingClientRect()
  if (rect) {
    panelStyle.value = {
      top: `${rect.bottom + 6}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`
    }
  }
}

function onDocPointerDown(e: PointerEvent): void {
  const t = e.target as Node
  if (wrapRef.value?.contains(t) || panelRef.value?.contains(t)) return
  open.value = false
}

function closeOnScroll(): void {
  open.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown)
  window.addEventListener('scroll', closeOnScroll, true)
  window.addEventListener('resize', closeOnScroll)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointerDown)
  window.removeEventListener('scroll', closeOnScroll, true)
  window.removeEventListener('resize', closeOnScroll)
})

/** 当前正在编辑的片段（最后一个分号之后） */
const currentSegment = computed(() => {
  const segs = props.modelValue.split(/[；;]/)
  return segs[segs.length - 1].trim()
})

const filtered = computed(() => {
  const kw = currentSegment.value.toLowerCase()
  if (!kw) return props.options.slice(0, 8)
  return props.options
    .filter((o) => o.label.toLowerCase().includes(kw) || o.value.toLowerCase().includes(kw))
    .slice(0, 8)
})

function onInput(v: string): void {
  emit('update:modelValue', v)
  open.value = true
  positionPanel()
}

/** 选中选项：替换正在编辑的片段并自动补齐「；」（多诊断连续录入） */
function pick(opt: ComboboxOption): void {
  const trimmed = props.modelValue.trim()
  const segs = trimmed
    .split(/[；;]/)
    .map((s) => s.trim())
    .filter(Boolean)
  const full = `${opt.value} ${opt.label}`
  // 末尾已有分号或为空：保留全部已完成片段；否则去掉未完成的末段
  const done =
    trimmed === '' || trimmed.endsWith('；') || trimmed.endsWith(';') ? segs : segs.slice(0, -1)
  emit('update:modelValue', [...done, full].join('；') + '；')
  open.value = false
  inputRef.value?.focus()
}
</script>

<style scoped>
.his-combo {
  position: relative;
  width: 100%;
}
.combo-input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  background: var(--card);
  color: var(--text);
  font-size: 13px;
  font-family: var(--font);
  outline: none;
  transition: 0.15s;
}
.combo-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}
.combo-input::placeholder {
  color: var(--text-mute);
}
.combo-panel {
  position: fixed;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  padding: 6px;
  z-index: 200;
  max-height: 240px;
  overflow-y: auto;
}
.combo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.12s;
}
.combo-item:hover {
  background: var(--primary-soft);
}
.combo-code {
  font-size: 12px;
  font-weight: 600;
  color: var(--primary);
  flex-shrink: 0;
}
.combo-label {
  font-size: 13px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
