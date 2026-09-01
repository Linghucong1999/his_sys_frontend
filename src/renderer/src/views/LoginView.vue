<template>
  <div class="login-view">
    <div class="login-card">
      <div class="login-left">
        <div class="logo-row">
          <div class="logo-box">✚</div>
          <h1>HIS 医疗信息管理系统</h1>
        </div>
        <div class="slogan">无挂号 · 医师驱动的下一代诊疗工作台</div>
        <div class="feat"><div class="fi">🆕</div>医师直接建档首诊，复诊姓名+手机号秒级调档</div>
        <div class="feat"><div class="fi">✨</div>AI 临床辅助：诊断建议、用药安全、语音病历</div>
        <div class="feat"><div class="fi">🔏</div>CA 电子签名贯穿病历、处方、会诊全流程</div>
      </div>
      <div class="login-right">
        <h2>欢迎回来 👋</h2>
        <div class="sub">请使用工号登录工作站</div>
        <div class="lb">工号</div>
        <input v-model="username" class="inp" style="height: 40px" placeholder="工号" @keydown.enter="doLogin" />
        <div class="lb">密码</div>
        <input
          v-model="password"
          class="inp"
          type="password"
          style="height: 40px"
          placeholder="密码"
          @keydown.enter="doLogin"
        />
        <div class="lb">登录角色（RBAC）</div>
        <div class="role-row">
          <div
            v-for="r in roles"
            :key="r.key"
            class="role-chip"
            :class="{ sel: selectedRole === r.key }"
            @click="selectedRole = r.key"
          >
            {{ r.icon }} {{ r.label }}
          </div>
        </div>
        <div v-if="errorMsg" class="login-error">{{ errorMsg }}</div>
        <button class="btn btn-primary login-btn" :disabled="loading" @click="doLogin">
          {{ loading ? '登录中…' : '登 录 →' }}
        </button>
        <div class="login-tip">
          演示账号：D1027 / 123456（医生）· admin / admin123（管理员）<br />
          登录即代表同意《电子签名使用协议》
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const username = ref('D1027')
const password = ref('123456')
const loading = ref(false)
const errorMsg = ref('')

const roles = [
  { key: 'doctor', icon: '🩺', label: '医生' },
  { key: 'nurse', icon: '💉', label: '护士' },
  { key: 'pharmacist', icon: '💊', label: '药房' },
  { key: 'admin', icon: '🛡', label: '管理员' }
]
const selectedRole = ref('doctor')

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return '早上好'
  if (h < 18) return '下午好'
  return '晚上好'
})

async function doLogin(): Promise<void> {
  if (!username.value || !password.value) {
    errorMsg.value = '请输入工号和密码'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    await userStore.login(username.value.trim(), password.value)
    router.push('/workbench')
  } catch (e) {
    errorMsg.value = (e as Error).message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-view {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  overflow: hidden;
}
.login-view::before,
.login-view::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.35;
  pointer-events: none;
}
.login-view::before {
  width: 480px;
  height: 480px;
  background: #0052d9;
  top: -140px;
  left: -120px;
}
.login-view::after {
  width: 420px;
  height: 420px;
  background: #00b8a9;
  bottom: -140px;
  right: -100px;
}
.login-card {
  position: relative;
  width: 880px;
  max-width: 94vw;
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 24px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  animation: fadeUp 0.5s ease;
}
.login-left {
  padding: 46px 42px;
  background: var(--grad);
  color: #fff;
  display: flex;
  flex-direction: column;
}
.logo-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.logo-box {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  backdrop-filter: blur(6px);
}
.login-left h1 {
  font-size: 21px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.slogan {
  margin-top: 26px;
  font-size: 15px;
  font-weight: 600;
  opacity: 0.95;
}
.feat {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 15px;
  font-size: 13px;
  opacity: 0.9;
}
.fi {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
}
.copy {
  margin-top: auto;
  font-size: 11px;
  opacity: 0.65;
}
.login-right {
  padding: 46px 42px;
}
.login-right h2 {
  font-size: 19px;
  font-weight: 700;
}
.sub {
  font-size: 12.5px;
  color: var(--text-mute);
  margin: 5px 0 20px;
}
.lb {
  font-size: 12px;
  color: var(--text-sub);
  margin: 13px 0 6px;
  font-weight: 500;
}
.role-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
.role-chip {
  padding: 9px 0;
  text-align: center;
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  font-size: 12.5px;
  color: var(--text-sub);
  cursor: pointer;
  transition: 0.15s;
}
.role-chip.sel {
  background: var(--primary-soft);
  color: var(--primary);
  border-color: var(--primary);
  font-weight: 600;
}
.login-btn {
  width: 100%;
  height: 42px;
  margin-top: 22px;
  font-size: 14px;
}
.login-error {
  margin-top: 12px;
  font-size: 12px;
  color: var(--red);
  background: var(--red-bg);
  padding: 8px 12px;
  border-radius: 9px;
}
.login-tip {
  margin-top: 14px;
  font-size: 11.5px;
  color: var(--text-mute);
  text-align: center;
  line-height: 1.7;
}
</style>
