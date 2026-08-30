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
  </div>
</template>

<style scoped>
.shell-main {
  margin: 86px 14px 14px 92px;
  transition: 0.3s;
}
</style>
