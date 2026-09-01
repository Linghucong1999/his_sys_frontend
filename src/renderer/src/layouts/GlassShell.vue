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
.shell-main {
  margin: 86px 14px 14px 92px;
  transition: 0.3s;
}
</style>
