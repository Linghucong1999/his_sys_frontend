<script setup lang="ts" generic="T">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Pagination from './Pagination.vue'

/**
 * 限高分页列表容器：
 * 根据容器实际高度动态计算每页条数（高度变化自动重算），
 * 列表项通过 #item 作用域插槽渲染，多余数据由底部分页控件翻页。
 */
const props = withDefaults(
  defineProps<{
    items: T[]
    /** 单行列表项高度（px），用于估算每页条数 */
    itemHeight?: number
    /** 标题 + 分页控件等保留高度（px） */
    reservedHeight?: number
    /** 每页最少条数 */
    minPerPage?: number
  }>(),
  { itemHeight: 52, reservedHeight: 118, minPerPage: 2 }
)

const page = ref(1)
const pageSize = ref(5)
const wrapRef = ref<HTMLElement>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.items.length / pageSize.value)))

const paged = computed(() => {
  const s = pageSize.value
  return props.items.slice((page.value - 1) * s, page.value * s)
})

function recalc(): void {
  const h = wrapRef.value?.clientHeight ?? 0
  if (h > props.reservedHeight) {
    pageSize.value = Math.max(
      props.minPerPage,
      Math.floor((h - props.reservedHeight) / props.itemHeight)
    )
  }
}

let ro: ResizeObserver | undefined
onMounted(() => {
  recalc()
  if (wrapRef.value) {
    ro = new ResizeObserver(() => recalc())
    ro.observe(wrapRef.value)
  }
})
onBeforeUnmount(() => ro?.disconnect())

// 数据量变化后防止页码越界
watch(
  () => props.items.length,
  () => {
    if (page.value > totalPages.value) page.value = totalPages.value
  }
)
</script>

<template>
  <div ref="wrapRef" class="paginated-list">
    <div class="pl-body">
      <slot v-for="(it, i) in paged" :key="i" name="item" :item="it" :index="i" />
      <div v-if="items.length === 0" class="pl-empty">
        <slot name="empty">暂无数据</slot>
      </div>
    </div>
    <Pagination :page="page" :total="items.length" :page-size="pageSize" @change="page = $event" />
  </div>
</template>

<style scoped>
.paginated-list {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
.pl-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.pl-empty {
  padding: 18px;
  text-align: center;
  color: var(--text-mute);
  font-size: 12.5px;
}
</style>
