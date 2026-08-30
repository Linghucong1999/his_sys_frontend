<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import CommandPalette from '@/components/CommandPalette.vue'

const userStore = useUserStore()
const router = useRouter()
const paletteOpen = ref(false)

function logout(): void {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="topbar">
    <div class="brand">HIS 医疗信息管理系统</div>
    <div class="cmdk" @click="paletteOpen = true">
      🔍 <span>姓名 + 手机号调档，或输入命令…</span><kbd>Ctrl K</kbd>
    </div>
    <div class="top-right">
      <button class="icon-btn" title="消息">🔔</button>
      <button class="icon-btn" title="CA 签名">🔏</button>
      <div class="avatar" :title="`${userStore.user?.realName ?? ''} · ${userStore.roleLabel}`">
        {{ (userStore.user?.realName ?? '医')[0] }}
      </div>
      <button class="icon-btn" title="退出登录" @click="logout">⏻</button>
    </div>
  </header>
  <CommandPalette v-model="paletteOpen" />
</template>

<style scoped>
.topbar {
  position: fixed;
  left: 92px;
  right: 14px;
  top: 14px;
  height: 58px;
  background: var(--glass);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
  padding: 0 18px;
  gap: 14px;
  z-index: 15;
  transition: 0.3s;
}
.brand {
  font-size: 15px;
  font-weight: 700;
  background: var(--grad);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.cmdk {
  flex: 1;
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 9px;
  height: 38px;
  padding: 0 14px;
  background: var(--card2);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text-mute);
  font-size: 13px;
  cursor: pointer;
  transition: 0.18s;
}
.cmdk:hover {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}
.cmdk kbd {
  margin-left: auto;
  font-family: var(--font);
  font-size: 11px;
  background: var(--card);
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  padding: 2px 7px;
  color: var(--text-sub);
}
.top-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}
.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--text-sub);
  background: var(--card2);
  border: 1px solid var(--border);
  transition: 0.18s;
}
.icon-btn:hover {
  color: var(--primary);
  border-color: var(--primary);
  transform: translateY(-1px);
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: var(--grad);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
}
</style>
