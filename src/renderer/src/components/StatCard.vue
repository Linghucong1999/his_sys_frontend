<template>
  <div class="card hover stat">
    <div class="ico" :style="{ background: iconBg, color: iconColor }">{{ icon }}</div>
    <div class="sl">{{ label }}</div>
    <div class="sv">{{ value }}</div>
    <div class="st" :class="subClass">{{ sub }}</div>
    <Sparkline :points="points" :color="color" />
  </div>
</template>

<script setup lang="ts">
import Sparkline from '@/components/Sparkline.vue'

defineProps<{
  icon: string
  iconBg: string
  iconColor: string
  label: string
  value: number
  sub: string
  subClass?: string
  points: string
  color: string
}>()
</script>

<style scoped>
.stat {
  padding: 18px;
  position: relative;
  overflow: hidden;
}
.sl {
  font-size: 12.5px;
  color: var(--text-sub);
}
.sv {
  font-size: 28px;
  font-weight: 700;
  margin: 5px 0 3px;
  letter-spacing: 0.5px;
}
.st {
  font-size: 11.5px;
}
.st.up {
  color: var(--green);
}
.st.dn {
  color: var(--red);
}
.ico {
  position: absolute;
  right: 14px;
  top: 14px;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
}
</style>
