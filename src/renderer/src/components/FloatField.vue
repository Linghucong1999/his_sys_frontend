<template>
  <div class="ff" :class="{ 'is-float': floated, 'is-focus': focused }">
    <div class="ff-body" @focusin="onFocusIn" @focusout="onFocusOut">
      <span class="ff-label">{{ label }}</span>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

/**
 * 浮标字段：替代「静默提示」的 placeholder。
 * 标签在空态时居中显示，聚焦或已填写后上浮到控件上方并常驻，避免用户输入后忘记该格含义。
 */
const props = defineProps<{
  /** 字段名：始终可见 */
  label: string
  /** 用于判断是否已有内容：字符串去空格、数组看长度、其余非空即视为有值 */
  value?: unknown
}>()

const focused = ref(false)

function onFocusIn(): void {
  focused.value = true
}

function onFocusOut(e: FocusEvent): void {
  // 焦点在包装内部元素之间移动时保持上浮，避免闪烁
  const next = e.relatedTarget as Node | null
  if (next && (e.currentTarget as HTMLElement).contains(next)) return
  focused.value = false
}

const hasValue = computed<boolean>(() => {
  const v = props.value
  if (v === null || v === undefined) return false
  if (typeof v === 'string') return v.trim() !== ''
  if (Array.isArray(v)) return v.length > 0
  return true
})

const floated = computed(() => focused.value || hasValue.value)
</script>

<style scoped>
.ff {
  /* 标签上浮时嵌在边框线上，不再额外占用顶部空间 */
  min-width: 0;
}
.ff-body {
  position: relative;
  z-index: 1;
  min-width: 0;
}
.ff-label {
  position: absolute;
  /* 高于控件本体：空态时标签压在输入框内，不被输入框背景遮挡 */
  z-index: 2;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  line-height: 1;
  color: var(--text-mute);
  pointer-events: none;
  white-space: nowrap;
  transition:
    top 0.15s ease,
    left 0.15s ease,
    font-size 0.15s ease,
    color 0.15s ease;
}
.ff.is-float .ff-label {
  /* 压在输入框顶边上，用底色切出缺口（Material 描边样式） */
  top: 0;
  left: 10px;
  transform: translateY(-50%);
  padding: 0 4px;
  border-radius: 4px;
  background: var(--ff-bg, var(--card));
  font-size: 11px;
}
.ff.is-focus .ff-label {
  color: var(--primary);
}
</style>
