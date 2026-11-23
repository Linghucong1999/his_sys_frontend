<template>
  <section class="settings-page">
    <div class="sec-hd">
      <div class="page-title">⚙️ 系统设置</div>
      <span class="tag tag-blue">共 {{ users.length }} 个账号</span>
      <span class="tag tag-orange">角色变更 / 停用会立即吊销该用户的登录会话</span>
    </div>

    <div class="card">
      <div class="u-row u-head">
        <span>工号</span><span>姓名</span><span>角色</span><span>科室</span><span>状态</span><span>操作</span>
      </div>
      <div v-for="u in users" :key="u._id" class="u-row" :class="{ off: !u.enabled }">
        <span class="u-no">{{ u.username }}</span>
        <span>{{ u.realName }}</span>
        <span class="u-roles">
          <span v-for="r in u.roles" :key="r" class="tag" :class="roleTagClass(r)">{{ ROLE_LABEL[r] ?? r }}</span>
        </span>
        <span class="u-dept">{{ u.department ?? '—' }}</span>
        <span>
          <span class="tag" :class="u.enabled ? 'tag-green' : 'tag-red'">{{ u.enabled ? '启用' : '已停用' }}</span>
        </span>
        <span class="u-ops">
          <button class="btn btn-ghost btn-sm" @click="openEdit(u)">编辑</button>
          <button class="btn btn-ghost btn-sm" @click="onResetPassword(u)">重置密码</button>
          <button class="btn btn-ghost btn-sm" :class="{ danger: u.enabled }" @click="toggleEnabled(u)">
            {{ u.enabled ? '停用' : '启用' }}
          </button>
        </span>
      </div>
      <div v-if="users.length === 0" class="empty">暂无账号</div>
    </div>

    <!-- 编辑抽屉 -->
    <div v-if="editing" class="ed-mask" @click.self="editing = null">
      <div class="ed-panel">
        <div class="ed-hd">
          <b>编辑账号 · {{ editing.username }}</b>
          <button class="icon-btn" @click="editing = null">✕</button>
        </div>
        <label class="ed-field">
          <span>姓名</span>
          <input v-model="form.realName" class="inp" />
        </label>
        <label class="ed-field">
          <span>科室</span>
          <input v-model="form.department" class="inp" />
        </label>
        <div class="ed-field">
          <span>角色</span>
          <div class="role-chips">
            <span
              v-for="r in ALL_ROLES"
              :key="r"
              class="role-chip"
              :class="{ sel: form.roles.includes(r) }"
              @click="toggleRole(r)"
            >
              {{ ROLE_LABEL[r] ?? r }}
            </span>
          </div>
        </div>
        <div v-if="errorMsg" class="ed-error">{{ errorMsg }}</div>
        <div class="ed-ft">
          <button class="btn btn-ghost" @click="editing = null">取消</button>
          <button class="btn btn-primary" :disabled="busy" @click="saveEdit">保存</button>
        </div>
      </div>
    </div>

    <!-- 临时密码展示（仅一次） -->
    <div v-if="tempPassword" class="ed-mask" @click.self="tempPassword = ''">
      <div class="ed-panel">
        <div class="ed-hd"><b>临时密码已生成</b></div>
        <p class="ed-note">
          请立即把临时密码交给该用户。该密码<strong>只显示这一次</strong>，用户下次登录会被强制修改。
        </p>
        <div class="temp-pwd">{{ tempPassword }}</div>
        <div class="ed-ft">
          <button class="btn btn-primary" @click="tempPassword = ''">我已记录</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import { listUsers, resetUserPassword, updateUser, type AdminUser } from '@/api/users'

const ROLE_LABEL: Record<string, string> = {
  admin: '管理员',
  manager: '管理者',
  doctor: '医生',
  nurse: '护士',
  pharmacist: '药师'
}
const ALL_ROLES = Object.keys(ROLE_LABEL)

const users = ref<AdminUser[]>([])
const editing = ref<AdminUser | null>(null)
const form = reactive<{ realName: string; department: string; roles: string[] }>({
  realName: '',
  department: '',
  roles: []
})
const busy = ref(false)
const errorMsg = ref('')
const tempPassword = ref('')

function roleTagClass(role: string): string {
  if (role === 'admin' || role === 'manager') return 'tag-blue'
  if (role === 'pharmacist') return 'tag-orange'
  return ''
}

async function load(): Promise<void> {
  try {
    users.value = await listUsers()
  } catch (e) {
    ElMessage.error((e as Error).message)
  }
}

function openEdit(u: AdminUser): void {
  editing.value = u
  form.realName = u.realName
  form.department = u.department ?? ''
  form.roles = [...u.roles]
  errorMsg.value = ''
}

function toggleRole(role: string): void {
  const idx = form.roles.indexOf(role)
  if (idx >= 0) form.roles.splice(idx, 1)
  else form.roles.push(role)
}

async function saveEdit(): Promise<void> {
  if (!editing.value) return
  if (form.roles.length === 0) {
    errorMsg.value = '至少保留一个角色'
    return
  }
  busy.value = true
  errorMsg.value = ''
  try {
    await updateUser(editing.value._id, {
      realName: form.realName.trim(),
      department: form.department.trim(),
      roles: form.roles
    })
    editing.value = null
    await load()
    ElMessage.success('已保存（若角色变更，该用户的登录会话已失效）')
  } catch (e) {
    errorMsg.value = (e as Error).message
  } finally {
    busy.value = false
  }
}

async function toggleEnabled(u: AdminUser): Promise<void> {
  const next = !u.enabled
  try {
    await ElMessageBox.confirm(
      next ? `确认启用「${u.realName}」？` : `确认停用「${u.realName}」？停用后其登录会话立即失效。`,
      next ? '启用账号' : '停用账号',
      { confirmButtonText: next ? '启用' : '停用', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }
  try {
    await updateUser(u._id, { enabled: next })
    await load()
    ElMessage.success(next ? '已启用' : '已停用')
  } catch (e) {
    ElMessage.error((e as Error).message)
  }
}

async function onResetPassword(u: AdminUser): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `为「${u.realName}」生成临时密码？其当前登录会话将立即失效，下次登录必须修改密码。`,
      '重置密码',
      { confirmButtonText: '重置', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }
  try {
    const res = await resetUserPassword(u._id)
    tempPassword.value = res.password
  } catch (e) {
    ElMessage.error((e as Error).message)
  }
}

onMounted(load)
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.u-row {
  display: grid;
  grid-template-columns: 120px 110px 1fr 140px 90px 240px;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}
.u-row:last-child {
  border-bottom: none;
}
.u-head {
  font-size: 11.5px;
  color: var(--text-mute);
  background: var(--card2);
  border-radius: 10px 10px 0 0;
}
.u-row.off {
  opacity: 0.6;
}
.u-no {
  font-variant-numeric: tabular-nums;
  color: var(--text-sub);
}
.u-roles {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.u-ops {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}
.u-ops .danger {
  color: var(--red);
}
.empty {
  padding: 28px;
  text-align: center;
  color: var(--text-mute);
  font-size: 13px;
}
.ed-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 20, 32, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 90;
}
.ed-panel {
  width: 420px;
  max-width: 92vw;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--r);
  box-shadow: var(--shadow-lg);
  padding: 16px 18px;
}
.ed-hd {
  display: flex;
  align-items: center;
  font-size: 14px;
  margin-bottom: 12px;
}
.ed-hd .icon-btn {
  margin-left: auto;
}
.ed-field {
  display: block;
  margin-bottom: 10px;
}
.ed-field > span {
  display: block;
  font-size: 11.5px;
  color: var(--text-mute);
  margin-bottom: 4px;
}
.role-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.role-chip {
  padding: 5px 12px;
  border: 1px solid var(--border-strong);
  border-radius: 9px;
  font-size: 12.5px;
  color: var(--text-sub);
  cursor: pointer;
  user-select: none;
  transition: 0.15s;
}
.role-chip.sel {
  background: var(--primary-soft);
  border-color: var(--primary);
  color: var(--primary);
  font-weight: 600;
}
.ed-note {
  font-size: 12.5px;
  color: var(--text-sub);
  line-height: 1.7;
}
.temp-pwd {
  margin: 10px 0 4px;
  padding: 10px 12px;
  background: var(--card2);
  border: 1px dashed var(--border-strong);
  border-radius: 9px;
  font-family: ui-monospace, monospace;
  font-size: 15px;
  letter-spacing: 1px;
  text-align: center;
  user-select: all;
}
.ed-error {
  font-size: 12px;
  color: var(--red);
}
.ed-ft {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}
</style>
