<template>
  <div v-if="visible" class="cp-mask" @click.self="!force && close()">
    <div class="cp-panel">
      <div class="cp-hd">
        <b>{{ force ? '请先修改密码' : '修改密码' }}</b>
        <button v-if="!force" class="icon-btn" @click="close">✕</button>
      </div>
      <div v-if="force" class="cp-warn">
        你的密码由管理员重置或为初始密码，必须修改后才能继续使用系统。
      </div>
      <label class="cp-field">
        <span>原密码</span>
        <input v-model="oldPassword" type="password" class="inp" autocomplete="current-password" />
      </label>
      <label class="cp-field">
        <span>新密码</span>
        <input v-model="newPassword" type="password" class="inp" autocomplete="new-password" />
      </label>
      <label class="cp-field">
        <span>确认新密码</span>
        <input v-model="confirmPassword" type="password" class="inp" autocomplete="new-password" />
      </label>
      <div class="cp-hint">至少 8 位，且同时包含字母与数字</div>
      <div v-if="errorMsg" class="cp-error">{{ errorMsg }}</div>
      <div class="cp-ft">
        <button v-if="!force" class="btn btn-ghost" @click="close">取消</button>
        <button class="btn btn-primary" :disabled="busy" @click="submit">
          {{ busy ? '提交中…' : '确认修改' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { changePassword } from '@/api/auth'

const props = defineProps<{ visible: boolean; force?: boolean }>()
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void; (e: 'done'): void }>()

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const errorMsg = ref('')
const busy = ref(false)

watch(
  () => props.visible,
  (v) => {
    if (v) {
      oldPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
      errorMsg.value = ''
    }
  }
)

function close(): void {
  emit('update:visible', false)
}

async function submit(): Promise<void> {
  errorMsg.value = ''
  if (!oldPassword.value || !newPassword.value) {
    errorMsg.value = '请填写原密码与新密码'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    errorMsg.value = '两次输入的新密码不一致'
    return
  }
  busy.value = true
  try {
    await changePassword(oldPassword.value, newPassword.value)
    emit('done')
  } catch (e) {
    errorMsg.value = (e as Error).message
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.cp-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 20, 32, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 95;
}
.cp-panel {
  width: 380px;
  max-width: 92vw;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--r);
  box-shadow: var(--shadow-lg);
  padding: 16px 18px;
}
.cp-hd {
  display: flex;
  align-items: center;
  font-size: 14px;
  margin-bottom: 12px;
}
.cp-hd .icon-btn {
  margin-left: auto;
}
.cp-warn {
  font-size: 12px;
  color: var(--orange);
  background: var(--orange-bg);
  border-radius: 8px;
  padding: 8px 10px;
  margin-bottom: 12px;
  line-height: 1.6;
}
.cp-field {
  display: block;
  margin-bottom: 10px;
}
.cp-field span {
  display: block;
  font-size: 11.5px;
  color: var(--text-mute);
  margin-bottom: 4px;
}
.cp-hint {
  font-size: 11.5px;
  color: var(--text-mute);
}
.cp-error {
  margin-top: 8px;
  font-size: 12px;
  color: var(--red);
}
.cp-ft {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}
</style>
