<template>
  <div class="journey">
    <div v-for="(n, i) in nodes" :key="i" class="j-item" :class="n.state">
      <div class="jt">{{ n.time }}</div>
      <div class="jb">{{ n.label }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface JourneyNode {
  time: string
  label: string
  state: 'done' | 'current' | 'todo'
}

/** 就诊旅程时间轴：建档 → 体征 → 接诊签名 → 处方审核 → 缴费取药（对齐 UI 稿） */
defineProps<{ nodes: JourneyNode[] }>()
</script>

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
.j-item.todo {
  opacity: 0.55;
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
