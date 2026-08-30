<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { createConsultation, listConsultations, respondConsultation, urgeConsultation } from '@/api/consultations'
import { searchPatients } from '@/api/patients'
import { listDictionaries } from '@/api/misc'
import { useUserStore } from '@/stores/user'
import type { Consultation, Patient } from '@/api/types'

const userStore = useUserStore()
const items = ref<Consultation[]>([])
const filter = ref<'all' | 'pending' | 'mine'>('all')
const busy = ref(false)
const errorMsg = ref('')

const form = reactive({
  patientKw: '',
  toDept: '心内科',
  type: 'normal' as 'normal' | 'urgent',
  summary: ''
})
const depts = ref<Array<{ name: string }>>([])
const patientHits = ref<Patient[]>([])
const selectedPatient = ref<Patient | null>(null)

const pending = computed(() => items.value.filter((c) => c.status === 'pending').length)
const active = computed(() => items.value.filter((c) => c.status === 'accepted').length)
const completed = computed(() => items.value.filter((c) => c.status === 'completed').length)

const filtered = computed(() => {
  if (filter.value === 'pending') return items.value.filter((c) => c.status === 'pending')
  if (filter.value === 'mine') {
    const dept = userStore.user?.department ?? '呼吸内科'
    return items.value.filter((c) => c.fromDept === dept)
  }
  return items.value
})

async function load(): Promise<void> {
  items.value = await listConsultations()
}

async function onPatientSearch(): Promise<void> {
  if (!form.patientKw.trim()) return
  patientHits.value = await searchPatients(form.patientKw.trim())
}

async function onSubmit(): Promise<void> {
  if (!selectedPatient.value) {
    errorMsg.value = '请先搜索并选择患者'
    return
  }
  if (!form.summary.trim()) {
    errorMsg.value = '请填写会诊事由'
    return
  }
  busy.value = true
  errorMsg.value = ''
  try {
    await createConsultation({
      patientId: selectedPatient.value._id,
      patientName: selectedPatient.value.name,
      patientRef: selectedPatient.value.medicalRecordNo,
      toDept: form.toDept,
      type: form.type,
      summary: form.summary.trim()
    })
    form.summary = ''
    selectedPatient.value = null
    patientHits.value = []
    await load()
  } catch (e) {
    errorMsg.value = (e as Error).message
  } finally {
    busy.value = false
  }
}

async function onRespond(c: Consultation): Promise<void> {
  busy.value = true
  try {
    await respondConsultation(c._id)
    await load()
  } finally {
    busy.value = false
  }
}

async function onUrge(c: Consultation): Promise<void> {
  busy.value = true
  try {
    await urgeConsultation(c._id)
    await load()
  } finally {
    busy.value = false
  }
}

function timeAgo(d: string | undefined): string {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 60) return `${min} 分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} 小时前`
  return `${Math.floor(h / 24)} 天前`
}

onMounted(async () => {
  await load()
  depts.value = await listDictionaries('department')
})
</script>

<template>
  <section>
    <div class="sec-hd">
      <div class="page-title">🤝 会诊管理</div>
      <div class="chip" :class="{ active: filter === 'all' }" @click="filter = 'all'">全部</div>
      <div class="chip" :class="{ active: filter === 'pending' }" @click="filter = 'pending'">
        待我响应 <span style="color: var(--red); font-weight: 700">{{ pending }}</span>
      </div>
      <div class="chip" :class="{ active: filter === 'mine' }" @click="filter = 'mine'">我发起的</div>
      <div style="margin-left: auto; display: flex; gap: 8px">
        <span class="tag tag-red">待响应 {{ pending }}</span>
        <span class="tag tag-blue">进行中 {{ active }}</span>
        <span class="tag tag-green">今日完成 {{ completed }}</span>
      </div>
    </div>
    <div class="grid2">
      <div>
        <div v-for="c in filtered" :key="c._id" class="card hover consult-card">
          <div class="cc-hd">
            <span class="tag" :class="c.type === 'urgent' ? 'tag-red' : c.status === 'accepted' ? 'tag-blue' : 'tag-orange'">
              {{ c.type === 'urgent' ? '⚡ 急会诊' : c.status === 'accepted' ? '进行中' : '普通会诊' }}
            </span>
            <b>{{ c.patientName }}</b>
            <span class="tag tag-blue">{{ c.patientRef }}</span>
            <span style="margin-left: auto; font-size: 11.5px; color: var(--text-mute)">
              {{ timeAgo(c.createdAt) }} · 已催办 {{ c.urgeCount }} 次
            </span>
          </div>
          <div class="cc-route">
            <span class="dept">{{ c.fromDept }}（发起）</span>→
            <span class="dept" style="border-color: var(--primary); color: var(--primary)">{{ c.toDept }}</span>
          </div>
          <div class="cc-desc">{{ c.summary }}</div>
          <div class="cc-ft">
            <button v-if="c.status === 'pending'" class="btn btn-primary btn-sm" :disabled="busy" @click="onRespond(c)">
              立即响应
            </button>
            <button v-else class="btn btn-ghost btn-sm">查看进度</button>
            <button class="btn btn-ghost btn-sm">查看病历摘要</button>
            <button v-if="c.status === 'pending'" class="btn btn-ghost btn-sm" :disabled="busy" @click="onUrge(c)">
              ⏰ 催办
            </button>
          </div>
        </div>
      </div>
      <!-- 发起会诊 -->
      <div class="card" style="padding: 18px">
        <div style="font-size: 14px; font-weight: 700; margin-bottom: 4px">＋ 发起会诊</div>
        <div style="font-size: 11.5px; color: var(--text-mute); margin-bottom: 13px">提交即 CA 签名，写入审计日志</div>
        <div class="qs-form">
          <div class="search-row">
            <input
              v-model="form.patientKw"
              class="inp search-inp"
              placeholder="🔍 患者：姓名 + 手机号调档"
              @keydown.enter="onPatientSearch"
            />
            <button class="btn btn-ghost btn-sm search-btn" @click="onPatientSearch">搜索</button>
          </div>
          <div v-for="p in patientHits" :key="p._id" class="qs-result" @click="selectedPatient = p; patientHits = []">
            <b style="font-size: 13px">{{ p.name }}</b>
            <span style="font-size: 11.5px; color: var(--text-mute)">{{ p.gender }} · {{ p.phone }}</span>
          </div>
          <div v-if="selectedPatient" class="sel-patient">已选：{{ selectedPatient.name }}</div>
          <select v-model="form.toDept" class="inp">
            <option v-for="d in depts" :key="d.name" :value="d.name">会诊科室：{{ d.name }}</option>
          </select>
          <select v-model="form.type" class="inp">
            <option value="normal">普通会诊（24h 内响应）</option>
            <option value="urgent">⚡ 急会诊（10 分钟内响应）</option>
          </select>
          <textarea v-model="form.summary" class="inp" placeholder="会诊事由与病情摘要…" style="min-height: 76px"></textarea>
          <div v-if="errorMsg" style="font-size: 12px; color: var(--red)">{{ errorMsg }}</div>
          <button class="btn btn-primary" :disabled="busy" @click="onSubmit">🔏 签名并提交申请</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.grid2 {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 14px;
  align-items: start;
}
.consult-card {
  padding: 16px 18px;
  margin-bottom: 10px;
  cursor: pointer;
}
.cc-hd {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
}
.cc-hd b {
  font-size: 14px;
}
.cc-route {
  margin: 8px 0 6px;
  font-size: 12.5px;
  color: var(--text-sub);
  display: flex;
  align-items: center;
  gap: 7px;
}
.dept {
  padding: 3px 10px;
  border-radius: 8px;
  background: var(--card2);
  border: 1px solid var(--border);
  font-size: 12px;
}
.cc-desc {
  font-size: 12.5px;
  color: var(--text-sub);
  line-height: 1.6;
}
.cc-ft {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 11px;
}
.qs-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.qs-result {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 11px;
  border: 1px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
}
.qs-result:hover {
  border-color: var(--primary);
}
.sel-patient {
  font-size: 12px;
  color: var(--green);
  background: var(--green-bg);
  padding: 6px 10px;
  border-radius: 8px;
}
.search-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.search-inp {
  flex: 1;
  min-width: 0;
}
.search-btn {
  flex-shrink: 0;
  white-space: nowrap;
}
</style>
