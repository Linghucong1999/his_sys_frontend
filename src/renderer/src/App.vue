<template>
  <RouterView />
  <CloseConfirmDialog :visible="closeConfirmVisible" @update:visible="closeConfirmVisible = $event" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterView } from 'vue-router'
import CloseConfirmDialog from '@/components/CloseConfirmDialog.vue'

/** 用户点击窗口关闭按钮时，展示 HIS 风格关闭确认弹窗（挂后台 / 全部关闭 / 取消） */
const closeConfirmVisible = ref(false)
let unsubscribeClose: (() => void) | null = null

onMounted(() => {
  unsubscribeClose = window.api.onCloseRequested(() => {
    closeConfirmVisible.value = true
  })
})

onUnmounted(() => {
  unsubscribeClose?.()
})
</script>

<style>
#app {
  height: 100%;
}
</style>
