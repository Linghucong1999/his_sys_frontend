<template>
  <div class="block" :class="{ hl: highlight }">
    <div class="bl">
      {{ label }}
      <span v-if="ai" class="ai">{{ ai }}</span>
    </div>
    <div class="bb"><slot /></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  ai?: string
  highlight?: boolean
}>()
</script>

<style scoped>
.block {
  margin: 14px 20px;
  padding: 15px 17px;
  background: var(--card2);
  border: 1px solid var(--border);
  border-radius: 13px;
  transition: 0.18s;
}
.block:hover {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}
.block.hl {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}
.bl {
  font-size: 12px;
  color: var(--text-mute);
  margin-bottom: 7px;
  display: flex;
  justify-content: space-between;
}
.ai {
  color: var(--violet);
  cursor: pointer;
  font-weight: 500;
}
.bb {
  font-size: 13.5px;
  line-height: 1.7;
}
</style>
