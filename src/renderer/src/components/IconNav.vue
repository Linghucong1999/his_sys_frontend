<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useDark, useToggle } from '@vueuse/core'

const route = useRoute()
const router = useRouter()

const isDark = useDark({
  selector: 'html',
  attribute: 'data-theme',
  valueDark: 'dark',
  valueLight: 'light'
})
const toggleDark = useToggle(isDark)

const navs = [
  { view: 'workbench', icon: '🏠', tip: '智能工作台' },
  { view: 'p360', icon: '🩺', tip: '患者 360° 工作站' },
  { view: 'inpatient', icon: '🛏', tip: '住院工作站' },
  { view: 'emr', icon: '📋', tip: '电子病历 EMR' },
  { view: 'consultations', icon: '🤝', tip: '会诊管理' }
]

function go(view: string): void {
  router.push('/' + view)
}
</script>

<template>
  <nav class="iconnav">
    <div class="logo">✚</div>
    <div
      v-for="n in navs"
      :key="n.view"
      class="inav"
      :class="{ active: route.path.startsWith('/' + n.view) }"
      @click="go(n.view)"
    >
      {{ n.icon }}
      <span class="tip">{{ n.tip }}</span>
      <span v-if="n.view === 'consultations'" class="dot">2</span>
    </div>
    <div class="inav" title="患者主索引 EMPI（建设中）">🪪<span class="tip">患者主索引 EMPI</span></div>
    <div class="bottom">
      <div class="inav" @click="toggleDark()">
        {{ isDark ? '☀️' : '🌙' }}
        <span class="tip">{{ isDark ? '切换浅色模式' : '切换深色模式' }}</span>
      </div>
      <div class="inav" title="系统设置（建设中）">⚙️<span class="tip">系统设置</span></div>
    </div>
  </nav>
</template>

<style scoped>
.iconnav {
  position: fixed;
  left: 14px;
  top: 14px;
  bottom: 14px;
  width: 64px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 20px;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  z-index: 20;
  transition: 0.3s;
}
.iconnav .logo {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--grad);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  font-weight: 700;
  margin-bottom: 14px;
  box-shadow: 0 4px 12px rgba(0, 82, 217, 0.35);
}
.inav {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--text-mute);
  margin: 3px 0;
  transition: 0.18s;
}
.inav:hover {
  background: var(--card2);
  color: var(--primary);
  transform: translateX(2px);
}
.inav.active {
  background: var(--primary-soft);
  color: var(--primary);
}
.inav.active::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 12px;
  bottom: 12px;
  width: 3px;
  border-radius: 2px;
  background: var(--primary);
}
.inav .tip {
  position: absolute;
  left: 56px;
  top: 50%;
  transform: translateY(-50%) translateX(-6px);
  background: var(--text);
  color: var(--bg);
  font-size: 12px;
  padding: 5px 11px;
  border-radius: 8px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: 0.18s;
  z-index: 30;
}
.inav:hover .tip {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}
.inav .dot {
  position: absolute;
  top: 8px;
  right: 8px;
  min-width: 15px;
  height: 15px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--red);
  color: #fff;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.iconnav .bottom {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
