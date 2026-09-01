<template>
  <div v-if="total > pageSize" class="his-pager">
    <div class="row">
      <button class="btn btn-ghost btn-sm" :disabled="page <= 1" @click="go(1)">« 首页</button>
      <button class="btn btn-ghost btn-sm" :disabled="page <= 1" @click="go(page - 1)">‹ 上一页</button>
      <template v-for="(p, i) in pageList" :key="p">
        <span v-if="i > 0 && p - pageList[i - 1] > 1" class="dots">…</span>
        <button class="num" :class="{ active: p === page }" @click="go(p)">{{ p }}</button>
      </template>
      <button class="btn btn-ghost btn-sm" :disabled="page >= totalPages" @click="go(page + 1)">
        下一页 ›
      </button>
      <button class="btn btn-ghost btn-sm" :disabled="page >= totalPages" @click="go(totalPages)">
        末页 »
      </button>
    </div>
    <div class="info">第 {{ page }} / {{ totalPages }} 页 · 共 {{ total }} 条 · 每页 {{ pageSize }} 条</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    page: number
    total: number
    pageSize?: number
  }>(),
  { pageSize: 10 }
)
const emit = defineEmits<{ (e: 'change', page: number): void }>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))

/** 页码序列：总页数 ≤7 全部显示；否则 1 … 当前±1 … 末页 */
const pageList = computed<number[]>(() => {
  const total = totalPages.value
  const cur = props.page
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const set = new Set<number>([1, total, cur - 1, cur, cur + 1])
  return [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
})

function go(p: number): void {
  if (p < 1 || p > totalPages.value || p === props.page) return
  emit('change', p)
}
</script>

<style scoped>
.his-pager {
  padding: 12px 0 4px;
}
.row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
}
.num {
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border-radius: 8px;
  border: 1px solid var(--border-strong);
  background: var(--card);
  color: var(--text-sub);
  font-size: 12px;
  cursor: pointer;
  transition: 0.15s;
}
.num:hover {
  border-color: var(--primary);
  color: var(--primary);
}
.num.active {
  background: var(--primary-soft);
  border-color: var(--primary);
  color: var(--primary);
  font-weight: 700;
}
.dots {
  color: var(--text-mute);
  padding: 0 2px;
}
.info {
  text-align: center;
  font-size: 11.5px;
  color: var(--text-mute);
  margin-top: 4px;
}
</style>
