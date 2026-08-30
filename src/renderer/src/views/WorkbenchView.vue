<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useTodoStore } from '@/stores/todo'
import StatCard from '@/components/StatCard.vue'
import QuickStartCard from '@/components/QuickStartCard.vue'

const router = useRouter()
const userStore = useUserStore()
const todoStore = useTodoStore()

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return '早上好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const dateText = computed(() => {
  const d = new Date()
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${week} · 上午门诊`
})

onMounted(() => {
  void todoStore.load()
})

function go(view: string): void {
  router.push('/' + view)
}
</script>

<template>
  <section>
    <div class="hero">
      <div>
        <h1>{{ greeting }}，<span>{{ userStore.user?.realName ?? '医生' }}</span> 👋</h1>
        <p>
          今天已接诊 <b>{{ todoStore.summary?.todayVisits ?? '—' }}</b> 位患者（新建档案
          {{ todoStore.summary?.firstVisits ?? '—' }} · 复诊调档 {{ todoStore.summary?.followupVisits ?? '—' }}）。有
          {{ todoStore.summary?.pendingSigns ?? '—' }} 份文档等待您 CA 签名。
        </p>
      </div>
      <div class="date-chip">📅 {{ dateText }}</div>
    </div>

    <div class="stats">
      <StatCard
        icon="🩺"
        icon-bg="var(--primary-soft)"
        icon-color="var(--primary)"
        label="今日接诊"
        :value="todoStore.summary?.todayVisits ?? 0"
        sub="较昨日"
        sub-class="up"
        points="0,26,22,25,16,19,10,13,6"
        color="#0052d9"
      />
      <StatCard
        icon="🔁"
        icon-bg="var(--orange-bg)"
        icon-color="var(--orange)"
        label="复诊调档"
        :value="todoStore.summary?.followupVisits ?? 0"
        sub="姓名+手机号 一键调档"
        points="0,14,18,12,20,16,22,18,24"
        color="#ed7b2f"
      />
      <StatCard
        icon="🔏"
        icon-bg="rgba(108,92,231,.12)"
        icon-color="var(--violet)"
        label="待 CA 签名"
        :value="todoStore.summary?.pendingSigns ?? 0"
        sub="需今日完成"
        sub-class="dn"
        points="0,20,24,14,22,8,12"
        color="#6c5ce7"
      />
      <StatCard
        icon="🤝"
        icon-bg="var(--green-bg)"
        icon-color="var(--green)"
        label="会诊请求"
        :value="todoStore.summary?.pendingConsultations ?? 0"
        sub="待响应"
        points="0,24,20,26,14,18,8"
        color="#2ba471"
      />
    </div>

    <div class="workbench">
      <div class="card now-patient">
        <div class="np-label"><span class="pulse"></span>快速开始 · 无需挂号，医师直接接诊</div>
        <QuickStartCard />
      </div>

      <div class="card todo">
        <h3>📌 待办聚合</h3>
        <div v-for="t in todoStore.todos" :key="t.id" class="todo-item" @click="t.kind === 'sign' ? go('emr') : t.kind === 'consult' ? go('consultations') : go('inpatient')">
          <div class="tic" :style="t.kind === 'sign' ? 'background:rgba(108,92,231,.12);color:var(--violet)' : t.kind === 'consult' ? 'background:var(--red-bg);color:var(--red)' : 'background:var(--orange-bg);color:var(--orange)'">
            {{ t.icon }}
          </div>
          <div class="tt">
            <b>{{ t.title }}</b>
            <small>{{ t.sub }}</small>
          </div>
          <span class="arr">›</span>
        </div>
      </div>
    </div>

    <div class="quick">
      <div class="card hover q" @click="go('p360')"><div class="qi" style="background:var(--primary-soft);color:var(--primary)">🆕</div><span>新建首诊</span></div>
      <div class="card hover q" @click="go('workbench')"><div class="qi" style="background:var(--green-bg);color:var(--green)">🔁</div><span>复诊调档</span></div>
      <div class="card hover q" @click="go('consultations')"><div class="qi" style="background:var(--orange-bg);color:var(--orange)">🤝</div><span>发起会诊</span></div>
      <div class="card hover q" @click="go('p360')"><div class="qi" style="background:rgba(108,92,231,.12);color:var(--violet)">✨</div><span>AI 病历助手</span></div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 18px;
  flex-wrap: wrap;
  gap: 10px;
}
.hero h1 {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.3px;
}
.hero h1 span {
  background: var(--grad);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.hero p {
  color: var(--text-sub);
  margin-top: 4px;
  font-size: 13px;
}
.date-chip {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 9px 16px;
  font-size: 12.5px;
  color: var(--text-sub);
  box-shadow: var(--shadow);
}
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 14px;
}
.workbench {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 14px;
  align-items: start;
}
.now-patient {
  padding: 22px;
  position: relative;
  overflow: hidden;
}
.now-patient::before {
  content: '';
  position: absolute;
  right: -60px;
  top: -60px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: var(--grad);
  opacity: 0.07;
}
.np-label {
  font-size: 12px;
  color: var(--text-mute);
  letter-spacing: 1px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.todo {
  padding: 18px;
}
.todo h3 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.todo-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 11px;
  border-radius: 11px;
  transition: 0.15s;
  cursor: pointer;
}
.todo-item:hover {
  background: var(--card2);
}
.tic {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}
.tt {
  flex: 1;
  min-width: 0;
}
.tt b {
  font-size: 13px;
  font-weight: 600;
  display: block;
}
.tt small {
  color: var(--text-mute);
  font-size: 11.5px;
}
.arr {
  color: var(--text-mute);
  font-size: 14px;
}
.quick {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-top: 14px;
}
.q {
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  text-align: center;
}
.qi {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: 0.2s;
}
.q:hover .qi {
  transform: scale(1.1) rotate(-4deg);
}
.q span {
  font-size: 12.5px;
  color: var(--text-sub);
}
</style>
