<template>
  <div class="card ai-panel">
    <div class="ai-hd"><div class="sparkle">✨</div>AI 临床辅助</div>
    <div class="ai-sec">诊断建议 · 按置信度</div>
    <div v-for="d in diagnoses" :key="d.name" class="ai-dx">
      <div class="nm">{{ d.name }} <span style="color: var(--violet)">{{ d.conf }}%</span></div>
      <div class="conf"><i :style="{ width: d.conf + '%' }"></i></div>
    </div>
    <div class="ai-sec">用药安全</div>
    <div v-for="(w, i) in warnings" :key="'w' + i" class="ai-warn">⚠ <span v-html="w"></span></div>
    <div v-for="(t, i) in tips" :key="'t' + i" class="ai-tip">✔ <span v-html="t"></span></div>
    <div class="ai-sec">相似病例</div>
    <div class="todo-item">
      <div class="tt">
        <b>{{ similarCount ?? 52 }} 例相似门诊病历</b>
        <small>{{ similarDesc ?? '87% 采用头孢呋辛 + 氨溴索方案' }}</small>
      </div>
      <span class="arr">›</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  diagnoses: Array<{ name: string; conf: number }>
  warnings: string[]
  tips: string[]
  similarCount?: number
  similarDesc?: string
}>()
</script>

<style scoped>
.ai-panel {
  padding: 18px;
}
.ai-hd {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 13px;
}
.sparkle {
  width: 26px;
  height: 26px;
  border-radius: 9px;
  background: linear-gradient(135deg, var(--violet), var(--primary));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}
.ai-dx {
  padding: 11px 13px;
  border: 1px solid var(--border);
  border-radius: 11px;
  margin-bottom: 8px;
  transition: 0.15s;
  cursor: pointer;
}
.ai-dx:hover {
  border-color: var(--violet);
  box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.12);
}
.nm {
  font-size: 13px;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
}
.conf {
  height: 5px;
  border-radius: 3px;
  background: var(--card2);
  margin-top: 8px;
  overflow: hidden;
}
.conf i {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--violet), var(--primary));
}
.ai-warn {
  display: flex;
  gap: 9px;
  padding: 10px 12px;
  border-radius: 11px;
  background: var(--red-bg);
  color: var(--red);
  font-size: 12px;
  line-height: 1.5;
  margin-bottom: 8px;
}
.ai-tip {
  display: flex;
  gap: 9px;
  padding: 10px 12px;
  border-radius: 11px;
  background: var(--green-bg);
  color: var(--green);
  font-size: 12px;
  line-height: 1.5;
  margin-bottom: 8px;
}
.todo-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 8px 10px;
  border-radius: 11px;
}
.tt {
  flex: 1;
  min-width: 0;
}
.tt b {
  font-size: 13px;
  font-weight: 600;
  display: block;
}
.tt small {
  color: var(--text-mute);
  font-size: 11.5px;
}
.arr {
  color: var(--text-mute);
  font-size: 14px;
}
</style>
