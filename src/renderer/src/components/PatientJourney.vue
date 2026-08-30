<script setup lang="ts">
import type { Visit } from '@/api/types'

defineProps<{ visits: Visit[] }>()

function fmt(d: string | undefined): string {
  if (!d) return ''
  const date = new Date(d)
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(
    date.getHours()
  ).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function label(v: Visit): string {
  if (v.type === 'first') return '建档 · 首诊（医师创建）'
  return '复诊调档'
}
</script>

<template>
  <div class="journey">
    <div v-for="(v, i) in visits" :key="String(v._id)" class="j-item" :class="{ done: true }">
      <div class="jt">{{ fmt(v.visitedAt) }}</div>
      <div class="jb">{{ label(v) }} · {{ v.department }}</div>
      <div v-if="i === visits.length - 1" class="jt">进行中</div>
    </div>
    <div v-if="visits.length === 0" class="j-item">
      <div class="jt">刚刚</div>
      <div class="jb">建档 · 首诊（医师创建）</div>
    </div>
  </div>
</template>

<style scoped>
.journey {
  margin-top: 16px;
  position: relative;
  padding-left: 18px;
}
.journey::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: linear-gradient(var(--primary), var(--accent));
  opacity: 0.25;
  border-radius: 1px;
}
.j-item {
  position: relative;
  padding: 0 0 14px 8px;
}
.j-item::before {
  content: '';
  position: absolute;
  left: -18px;
  top: 5px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--card);
  border: 2.5px solid var(--primary);
}
.j-item.done::before {
  background: var(--primary);
}
.jt {
  font-size: 11px;
  color: var(--text-mute);
}
.jb {
  font-size: 12.5px;
  font-weight: 500;
  margin-top: 1px;
}
</style>
