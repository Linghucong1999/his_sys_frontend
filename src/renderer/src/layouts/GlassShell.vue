<template>
  <div class="shell">
    <IconNav />
    <TopBar />
    <main class="shell-main">
      <RouterView v-slot="{ Component }">
        <!-- 不做 out-in：异步视图加载时避免出现空白窗口期 -->
        <Transition name="fade-up" appear>
          <component :is="Component" :key="route.path" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import IconNav from '@/components/IconNav.vue'
import TopBar from '@/components/TopBar.vue'

const route = useRoute()
</script>

<style scoped>
/* 主内容区自带滚动容器：不依赖根滚动器，滚轮/滚动条都在面板内部生效 */
.shell-main {
  margin: 86px 14px 14px 92px;
  height: calc(100vh - 100px);
  overflow-y: auto;
  overflow-x: hidden;
  transition: 0.3s;
}

/* 滚动条常显（Chromium 覆盖式滚动条默认只在滚动时出现，用户会以为无法滚动） */
.shell-main::-webkit-scrollbar {
  width: 10px;
}
.shell-main::-webkit-scrollbar-track {
  background: transparent;
}
.shell-main::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 6px;
  border: 2px solid transparent;
  background-clip: content-box;
}
.shell-main::-webkit-scrollbar-thumb:hover {
  background: var(--text-mute);
  background-clip: content-box;
}
</style>
