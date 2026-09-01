<template>
  <div ref="wrapRef" class="his-select">
    <div
      class="select-trigger"
      :class="{ placeholder: !modelValue }"
      @click="toggle"
    >
      <span class="select-text">{{ modelValue ? currentLabel : placeholder }}</span>
      <span class="select-arrow" :class="{ open }"></span>
    </div>
    <Teleport to="body">
      <Transition name="fade-up">
        <div v-if="open" ref="panelRef" class="select-panel" :style="panelStyle">
          <div
            v-for="o in options"
            :key="o.value"
            class="select-item"
            :class="{ sel: o.value === modelValue }"
            @click="select(o.value)"
          >
            {{ o.label }}
          </div>
          <div v-if="options.length === 0" class="select-empty">暂无选项</div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

export interface SelectOption {
  value: string
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    options: SelectOption[]
    placeholder?: string
  }>(),
  { placeholder: '请选择' }
)
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const open = ref(false)
const wrapRef = ref<HTMLElement>()
const panelRef = ref<HTMLElement>()

/** 点击触发器/面板以外区域时关闭（面板 Teleport 到 body，需同时判定两者） */
function onDocPointerDown(e: PointerEvent): void {
  const t = e.target as Node
  if (wrapRef.value?.contains(t) || panelRef.value?.contains(t)) return
  open.value = false
}

/** 面板 Teleport 到 body 后按触发器位置 fixed 定位，避免被卡片 overflow 裁剪 */
const panelStyle = ref<{ top: string; left: string; width: string }>({
  top: '0px',
  left: '0px',
  width: '0px'
})

function toggle(): void {
  if (!open.value) {
    const rect = wrapRef.value?.getBoundingClientRect()
    if (rect) {
      panelStyle.value = {
        top: `${rect.bottom + 6}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`
      }
    }
  }
  open.value = !open.value
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

const currentLabel = computed(() => {
  const opt = props.options.find((o) => o.value === props.modelValue)
  return opt ? opt.label : ''
})

function select(v: string): void {
  emit('update:modelValue', v)
  open.value = false
}
</script>

<style scoped>
.his-select {
  position: relative;
  width: 100%;
}
.select-trigger {
  height: 36px;
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  background: var(--card);
  display: flex;
  align-items: center;
  padding: 0 30px 0 12px;
  cursor: pointer;
  transition: 0.15s;
  user-select: none;
}
.select-trigger:hover {
  border-color: var(--primary);
}
.select-trigger:focus-visible {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}
.select-text {
  font-size: 13px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.select-trigger.placeholder .select-text {
  color: var(--text-mute);
}
.select-arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  width: 12px;
  height: 12px;
  transform: translateY(-50%);
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239aa3b2' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  transition: transform 0.18s;
}
.select-arrow.open {
  transform: translateY(-50%) rotate(180deg);
}
.select-panel {
  position: fixed;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  padding: 6px;
  z-index: 200;
  max-height: 220px;
  overflow-y: auto;
}
.select-item {
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
  transition: 0.12s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.select-item:hover {
  background: var(--card2);
}
.select-item.sel {
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 600;
}
.select-empty {
  padding: 14px;
  text-align: center;
  color: var(--text-mute);
  font-size: 12px;
}
</style>
