<script setup lang="ts">
import { onMounted, ref } from 'vue'

// 桌面端信息（由 preload 暴露）
const platform = ref('')

onMounted(() => {
  platform.value = window.api?.platform ?? 'unknown'
})
</script>

<template>
  <el-container class="home-page">
    <el-header class="home-header">
      <span class="app-name">HIS 医生工作站</span>
      <el-tag size="small">桌面端 {{ platform }}</el-tag>
    </el-header>
    <el-main>
      <el-empty description="骨架已就绪，等待 UI 设计稿后填充各业务模块页面" />
    </el-main>
  </el-container>
</template>

<style scoped>
.home-page {
  height: 100%;
}
.home-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
}
.app-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f6feb;
}
</style>
