<template>
  <svg class="spark" viewBox="0 0 200 34" preserveAspectRatio="none">
    <path :d="path" :stroke="color" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    points: string
    color?: string
  }>(),
  { color: '#0052d9' }
)

/** SVG path：把逗号分隔的数字映射到 200x34 视口 */
const path = computed(() => {
  const values = props.points
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((n) => !Number.isNaN(n))
  if (values.length === 0) return ''
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = 200 / (values.length - 1 || 1)
  return values
    .map((v, i) => {
      const x = i * step
      const y = 4 + ((max - v) / range) * 26
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(0)},${y.toFixed(0)}`
    })
    .join(' ')
})
</script>

<style scoped>
.spark {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 34px;
  opacity: 0.85;
}
.spark path {
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
}
</style>
