<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import IconNav from '@/components/IconNav.vue'
import TopBar from '@/components/TopBar.vue'

const route = useRoute()
</script>

<template>
  <div class="shell">
    <IconNav />
    <TopBar />
    <main class="shell-main">
      <RouterView v-slot="{ Component }">
        <Transition name="fade-up" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>
    <div class="demo-tag">创新概念版 · 演示数据非真实患者</div>
  </div>
</template>

<style scoped>
.shell-main {
  margin: 86px 14px 14px 92px;
  transition: 0.3s;
}
.demo-tag {
  position: fixed;
  right: 18px;
  bottom: 14px;
  background: var(--glass);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  color: var(--text-sub);
  font-size: 11px;
  padding: 6px 13px;
  border-radius: 10px;
  z-index: 50;
}
</style>
