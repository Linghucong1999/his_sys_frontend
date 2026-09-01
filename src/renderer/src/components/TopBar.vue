<template>
  <header class="topbar">
    <div class="brand">HIS 医疗信息管理系统</div>
    <div class="cmdk" @click="paletteOpen = true">
      🔍 <span>姓名 + 手机号调档，或输入命令…</span><kbd>Ctrl K</kbd>
    </div>
    <div class="top-right">
      <!-- 🔔 消息通知：待办聚合面板 -->
      <div ref="notifyRef" class="pop-wrap">
        <button class="icon-btn" title="消息通知" @click="notifyOpen = !notifyOpen">
          🔔
          <span v-if="todoStore.summary" class="badge">{{ todoStore.summary.todoCount }}</span>
        </button>
        <div v-if="notifyOpen" class="pop notify-pop">
          <div class="pop-hd">📌 待办通知</div>
          <div v-for="t in todoStore.todos" :key="t.id" class="pop-item" @click="goTodo(t.kind)">
            <span class="pop-ico">{{ t.icon }}</span>
            <div class="pop-tt">
              <b>{{ t.title }}</b>
              <small>{{ t.sub }}</small>
            </div>
            <span class="arr">›</span>
          </div>
          <div v-if="todoStore.todos.length === 0" class="pop-empty">暂无待办</div>
        </div>
      </div>

      <!-- 🔏 CA 签名入口 -->
      <button class="icon-btn" title="CA 签名" @click="goSigning">🔏</button>

      <!-- 👤 用户菜单 -->
      <div ref="userMenuRef" class="pop-wrap">
        <button class="avatar" title="用户菜单" @click="userMenuOpen = !userMenuOpen">
          {{ (userStore.user?.realName ?? '医')[0] }}
        </button>
        <div v-if="userMenuOpen" class="pop user-pop">
          <div class="pop-hd">
            <div class="u-ava">{{ (userStore.user?.realName ?? '医')[0] }}</div>
            <div>
              <div class="u-name">{{ userStore.user?.realName }}</div>
              <div class="u-sub">
                {{ roleMap[userStore.user?.roles?.[0] ?? ''] ?? userStore.user?.roles?.[0] ?? '' }} ·
                {{ userStore.user?.department ?? '—' }}
              </div>
            </div>
          </div>
          <div class="pop-item" @click="logout">⏻ 退出登录</div>
        </div>
      </div>
    </div>
  </header>
  <CommandPalette v-model="paletteOpen" />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import { useUserStore } from '@/stores/user'
import { useTodoStore } from '@/stores/todo'
import CommandPalette from '@/components/CommandPalette.vue'

const userStore = useUserStore()
const todoStore = useTodoStore()
const router = useRouter()

const paletteOpen = ref(false)
const notifyOpen = ref(false)
const userMenuOpen = ref(false)

const notifyRef = ref<HTMLElement>()
const userMenuRef = ref<HTMLElement>()
onClickOutside(notifyRef, () => (notifyOpen.value = false))
onClickOutside(userMenuRef, () => (userMenuOpen.value = false))

onMounted(() => {
  if (!todoStore.summary) void todoStore.load()
})

/** 🔏 CA 签名：跳转 EMR 待签名列表 */
function goSigning(): void {
  router.push({ path: '/emr', query: { filter: 'unsigned' } })
}

function goTodo(kind: string): void {
  notifyOpen.value = false
  if (kind === 'sign') router.push({ path: '/emr', query: { filter: 'unsigned' } })
  else if (kind === 'rx' || kind === 'emr') router.push('/p360')
  else if (kind === 'consult') router.push('/consultations')
  else router.push('/inpatient')
}

function logout(): void {
  userMenuOpen.value = false
  userStore.logout()
  router.push('/login')
}

const roleMap: Record<string, string> = {
  admin: '管理员',
  doctor: '医生',
  nurse: '护士',
  pharmacist: '药师'
}
</script>

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
  position: relative;
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
.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--red);
  color: #fff;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
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
.pop-wrap {
  position: relative;
}
.pop {
  position: absolute;
  top: 46px;
  right: 0;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: var(--shadow-lg);
  z-index: 40;
  animation: fadeUp 0.18s ease;
  overflow: hidden;
}
.notify-pop {
  width: 320px;
  max-height: 380px;
  overflow-y: auto;
}
.user-pop {
  width: 220px;
}
.pop-hd {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}
.pop-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  transition: 0.12s;
}
.pop-item:hover {
  background: var(--card2);
}
.pop-ico {
  font-size: 14px;
  flex-shrink: 0;
}
.pop-tt {
  flex: 1;
  min-width: 0;
}
.pop-tt b {
  font-size: 12.5px;
  font-weight: 600;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pop-tt small {
  color: var(--text-mute);
  font-size: 11px;
}
.arr {
  color: var(--text-mute);
}
.pop-empty {
  padding: 24px;
  text-align: center;
  color: var(--text-mute);
  font-size: 12px;
}
.u-ava {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--grad);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
}
.u-name {
  font-size: 13.5px;
  font-weight: 700;
}
.u-sub {
  font-size: 11px;
  color: var(--text-mute);
  margin-top: 2px;
}
</style>
