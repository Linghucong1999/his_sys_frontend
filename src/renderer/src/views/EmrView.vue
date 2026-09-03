<template>
  <section class="emr-page">
    <div class="sec-hd">
      <div class="page-title">📋 电子病历</div>
      <input
        v-model="keyword"
        class="inp"
        placeholder="🔍 姓名 + 手机号 / 档案号"
        style="width: 260px"
        @keydown.enter="onSearch"
      />
      <button class="btn btn-ghost btn-sm" @click="onSearch">搜索</button>
      <div class="chip" :class="{ active: filter === 'all' }" @click="changeFilter('all')">全部</div>
      <div class="chip" :class="{ active: filter === 'unsigned' }" @click="changeFilter('unsigned')">待签名</div>
      <div class="chip" :class="{ active: filter === 'signed' }" @click="changeFilter('signed')">已签名</div>
      <div class="chip" :class="{ active: filter === 'recent' }" @click="changeFilter('recent')">近 30 天 ▾</div>
      <span class="tag tag-blue" style="margin-left: auto">共 {{ patientGroups.length }} 位患者</span>
    </div>

    <!-- 左右模块随视窗高度自适应，内部滚动 -->
    <div class="grid2">
      <!-- 左侧：患者列表（同一患者聚合，不随类型刷新） -->
      <div class="card left-card">
        <div class="emr-list">
          <div
            v-for="g in patientGroups"
            :key="g.patientId"
            class="emr-item"
            :class="{ sel: activePatientId === g.patientId }"
            @click="selectPatient(g.patientId)"
          >
            <div class="ed">{{ fmt(g.latestAt) }}<br /><small>{{ isToday(g.latestAt) ? '今日' : '' }}</small></div>
            <div class="tt" style="flex: 1; min-width: 0">
              <b style="font-size: 13px">{{ g.patientName }} · {{ g.latestDiagnosis }}</b>
              <div style="font-size: 11.5px; color: var(--text-mute); margin-top: 1px">
                门诊 {{ g.outpatientCount }} · 处方 {{ g.prescriptionCount }} · 入院 {{ g.admissionCount }}
              </div>
            </div>
            <span v-if="g.unsignedCount > 0" class="tag tag-orange">{{ g.unsignedCount }} 待签</span>
            <span v-else class="tag tag-green">已签</span>
          </div>
          <div v-if="patientGroups.length === 0" class="empty">暂无病历</div>
        </div>
        <Pagination :page="page" :total="total" :page-size="pageSize" @change="goPage" />
      </div>

      <!-- 右侧：患者详情（门诊病历 / 处方 / 入院记录 三个 tab，切换不刷新列表） -->
      <div v-if="activePatient" class="card right-card">
        <div class="prev-hd">
          <b style="font-size: 15px">{{ activePatient.patientName }} · {{ typeLabel(activeTab) }}</b>
          <span class="tag tag-blue">{{ selected?.recordNo ?? '' }}</span>
          <span v-if="selected" class="tag" :class="selected.signed ? 'tag-green' : 'tag-orange'">
            {{ selected.signed ? `🔏 已 CA 签名 ${selected.signedAt ? new Date(selected.signedAt).toLocaleString('zh-CN') : ''}` : '待签名' }}
          </span>
          <span v-if="selected" style="margin-left: auto; font-size: 11.5px; color: var(--text-mute)">
            {{ fmtFull(selected.visitedAt) }} · {{ selected.doctorName }} · {{ selected.department }}
          </span>
        </div>
        <!-- 患者内三个 tab：切换只换内容，不刷新患者列表 -->
        <div class="ptabs">
          <div
            v-for="t in PATIENT_TABS"
            :key="t.value"
            class="ptab"
            :class="{ active: activeTab === t.value }"
            @click="activeTab = t.value; tabIndex = 0"
          >
            {{ t.label }}<span class="ptab-n">{{ tabCount(t.value) }}</span>
          </div>
        </div>
        <!-- 同一 tab 内多次就诊：日期横滑选单（不换行、不挤压页面） -->
        <div v-if="tabRecords.length > 1" class="visit-row-wrap">
          <div class="visit-row">
            <div
              v-for="(r, i) in tabRecords"
              :key="r._id"
              class="visit-chip"
              :class="{ active: tabIndex === i }"
              @click="tabIndex = i"
            >
              {{ fmtFull(r.visitedAt) }}<span v-if="r.signed" class="dot-done"></span>
            </div>
          </div>
          <span class="visit-count">共 {{ tabRecords.length }} 次</span>
        </div>
        <div v-if="selected" class="prev-body">
          <!-- 处方类型：处方笺版式 -->
          <div v-if="activeTab === 'prescription'" class="rx-pad">
            <div class="rx-title">处 方 笺</div>
            <div class="rx-meta">
              <span>姓名：{{ selected.patientName }}</span>
              <span>科别：{{ selected.department }}</span>
              <span>日期：{{ fmtFull(selected.visitedAt) }}</span>
              <span>处方编号：{{ selected.recordNo }}</span>
            </div>
            <div class="rx-dx">临床诊断：{{ rxDiagnosis || '—' }}</div>
            <div class="rx-rp">
              <div class="rx-rp-h">Rp</div>
              <div v-for="(item, i) in rxItems" :key="i" class="rx-item">{{ i + 1 }}. {{ item }}</div>
              <div v-if="rxItems.length === 0" class="rx-empty">（暂无处方明细）</div>
            </div>
            <div class="rx-sign">
              <span>医师：{{ selected.signedBy ?? selected.doctorName }}</span>
              <span v-if="selected.signed" class="tag tag-green">🔏 已 CA 签名</span>
              <span v-else class="tag tag-orange">待签名</span>
            </div>
          </div>
          <!-- 门诊/入院：区块版式 -->
          <template v-else>
            <div v-if="selected.chiefComplaint" class="block">
              <div class="bl">主诉</div>
              <div class="bb">{{ selected.chiefComplaint }}</div>
            </div>
            <div v-if="selected.presentIllness" class="block">
              <div class="bl">现病史</div>
              <div class="bb">{{ selected.presentIllness }}</div>
            </div>
            <div v-if="selected.pastHistory" class="block">
              <div class="bl">既往史</div>
              <div class="bb">{{ selected.pastHistory }}</div>
            </div>
            <div v-if="selected.physicalExam" class="block">
              <div class="bl">体格检查</div>
              <div class="bb">{{ selected.physicalExam }}</div>
            </div>
            <div v-if="selected.examRequest" class="block">
              <div class="bl">检查申请</div>
              <div class="bb">{{ selected.examRequest }}</div>
            </div>
            <div v-if="selected.diagnosis.length > 0" class="block hl">
              <div class="bl">诊断</div>
              <div class="bb" style="font-weight: 600">
                <div v-for="d in selected.diagnosis" :key="d.code">{{ d.code }} {{ d.name }}</div>
              </div>
            </div>
            <div v-if="selected.prescriptionSummary" class="block">
              <div class="bl">处方摘要</div>
              <div class="bb">{{ selected.prescriptionSummary }}</div>
            </div>
          </template>
        </div>
        <div v-else class="empty">该患者暂无{{ typeLabel(activeTab) }}</div>
        <div class="prev-ft">
          <button class="btn btn-ghost" :disabled="busy || !selected" @click="onPrint">🖨 打印</button>
          <button class="btn btn-ghost">复制为新病历模板</button>
          <button v-if="selected && !selected.signed" class="btn btn-primary" :disabled="busy" @click="onSign">🔏 CA 签名</button>
          <button v-else class="btn btn-primary" @click="router.push('/p360')">🔁 复诊续方</button>
        </div>
      </div>
      <div v-else class="card right-card empty-card">← 从左侧选择患者查看病历</div>
    </div>
  </section>
  <PrintPreviewDialog v-model:visible="previewVisible" :title="previewTitle" :print-html="previewHtml" />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useWindowSize } from '@vueuse/core'
import { fetchRecordPage, signRecord } from '@/api/emr'
import { fetchPatient } from '@/api/patients'
import { buildRecordPrintHtml } from '@/utils/print'
import PrintPreviewDialog from '@/components/PrintPreviewDialog.vue'
import Pagination from '@/components/Pagination.vue'
import { ElMessageBox } from 'element-plus'
import 'element-plus/es/components/message-box/style/css'
import type { MedicalRecord } from '@/api/types'

/** 统一错误弹窗 */
function alertError(msg: string, title = '操作失败'): void {
  void ElMessageBox.alert(msg, title, { confirmButtonText: '知道了', type: 'error' })
}

const router = useRouter()
const route = useRoute()
const { height: windowHeight } = useWindowSize()

const records = ref<MedicalRecord[]>([])
const keyword = ref('')
const filter = ref<'all' | 'unsigned' | 'signed' | 'recent'>('all')
const busy = ref(false)
const page = ref(1)
const total = ref(0)

const PATIENT_TABS = [
  { value: 'outpatient', label: '门诊病历' },
  { value: 'prescription', label: '💊 处方' },
  { value: 'admission', label: '入院记录' }
] as const

const activePatientId = ref('')
const activeTab = ref<'outpatient' | 'prescription' | 'admission'>('outpatient')
const tabIndex = ref(0)

/** 动态每页条数：按视窗高度计算 */
const pageSize = computed(() => {
  const vh = windowHeight.value
  return Math.min(50, Math.max(5, Math.floor((vh - 210) / 58)))
})

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

interface PatientGroup {
  patientId: string
  patientName: string
  latestAt?: string
  latestDiagnosis: string
  outpatientCount: number
  prescriptionCount: number
  admissionCount: number
  unsignedCount: number
  records: MedicalRecord[]
}

/** 患者聚合：同一患者的所有类型病历归到一组 */
const patientGroups = computed<PatientGroup[]>(() => {
  const map = new Map<string, PatientGroup>()
  for (const r of records.value) {
    let g = map.get(r.patientId)
    if (!g) {
      g = {
        patientId: r.patientId,
        patientName: r.patientName,
        latestDiagnosis: '',
        outpatientCount: 0,
        prescriptionCount: 0,
        admissionCount: 0,
        unsignedCount: 0,
        records: []
      }
      map.set(r.patientId, g)
    }
    g.records.push(r)
    if (r.type === 'outpatient') g.outpatientCount++
    else if (r.type === 'prescription') g.prescriptionCount++
    else g.admissionCount++
    if (!r.signed) g.unsignedCount++
    if (!g.latestAt || new Date(r.visitedAt ?? 0) > new Date(g.latestAt)) {
      g.latestAt = r.visitedAt
      g.latestDiagnosis = r.diagnosis[0]?.name ?? '—'
    }
  }
  return [...map.values()]
})

const activePatient = computed(() => patientGroups.value.find((g) => g.patientId === activePatientId.value) ?? null)

const tabRecords = computed(() => {
  if (!activePatient.value) return []
  return activePatient.value.records
    .filter((r) => r.type === activeTab.value)
    .sort((a, b) => new Date(b.visitedAt ?? 0).getTime() - new Date(a.visitedAt ?? 0).getTime())
})

const selected = computed<MedicalRecord | null>(() => tabRecords.value[Math.min(tabIndex.value, tabRecords.value.length - 1)] ?? null)

function tabCount(t: typeof activeTab.value): number {
  return activePatient.value?.records.filter((r) => r.type === t).length ?? 0
}

function typeLabel(t: typeof activeTab.value): string {
  return t === 'prescription' ? '处方' : t === 'admission' ? '入院记录' : '门诊病历'
}

/** 选中患者：自动定位到第一个有内容的 tab（门诊优先） */
function selectPatient(patientId: string): void {
  activePatientId.value = patientId
  const g = activePatient.value
  if (!g) return
  if (g.outpatientCount > 0) activeTab.value = 'outpatient'
  else if (g.prescriptionCount > 0) activeTab.value = 'prescription'
  else activeTab.value = 'admission'
  tabIndex.value = 0
}

const rxItems = computed(() => {
  if (!selected.value?.prescriptionSummary) return []
  return selected.value.prescriptionSummary
    .split(/[；;]/)
    .map((s) => s.trim())
    .filter(Boolean)
})

const rxDiagnosis = computed(() =>
  selected.value?.diagnosis.map((d) => (d.code ? `${d.code} ${d.name}` : d.name)).join('；') ?? ''
)

async function load(): Promise<void> {
  const result = await fetchRecordPage({
    keyword: keyword.value.trim() || undefined,
    signed: filter.value === 'unsigned' ? 'false' : filter.value === 'signed' ? 'true' : undefined,
    recent: filter.value === 'recent' ? true : undefined,
    type: undefined,
    page: page.value,
    pageSize: pageSize.value
  })
  records.value = result.items
  total.value = result.total
  // 保持当前选中患者；不在结果中则回退到第一位
  if (!patientGroups.value.some((g) => g.patientId === activePatientId.value)) {
    const first = patientGroups.value[0]
    if (first) selectPatient(first.patientId)
    else activePatientId.value = ''
  }
}

function changeFilter(f: typeof filter.value): void {
  filter.value = f
  page.value = 1
  void load()
}

function onSearch(): void {
  page.value = 1
  void load()
}

async function goPage(p: number): Promise<void> {
  if (p < 1 || p > totalPages.value || p === page.value) return
  page.value = p
  await load()
}

watch(pageSize, () => {
  if (records.value.length > 0) {
    page.value = 1
    void load()
  }
})

function fmt(d: string | undefined): string {
  if (!d) return ''
  const date = new Date(d)
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function isToday(d: string | undefined): boolean {
  if (!d) return false
  const date = new Date(d)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

function fmtFull(d: string | undefined): string {
  if (!d) return ''
  const date = new Date(d)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

async function onSign(): Promise<void> {
  if (!selected.value || selected.value.signed) return
  busy.value = true
  try {
    await signRecord(selected.value._id)
    await load()
  } finally {
    busy.value = false
  }
}

const previewVisible = ref(false)
const previewHtml = ref('')
const previewTitle = ref('')

async function onPrint(): Promise<void> {
  if (!selected.value) return
  busy.value = true
  try {
    const patient = await fetchPatient(selected.value.patientId)
    previewHtml.value = buildRecordPrintHtml(selected.value, patient)
    previewTitle.value = `${typeLabel(activeTab.value)} · ${selected.value.patientName}`
    previewVisible.value = true
  } catch (e) {
    alertError((e as Error).message)
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  const f = route.query.filter
  if (f === 'unsigned' || f === 'signed' || f === 'recent') {
    filter.value = f
  }
  void load()
})
</script>

<style scoped>
.emr-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 78px);
}
.grid2 {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 12px;
  min-height: 0;
  flex: 1;
}
.left-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.right-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.emr-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}
.emr-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 12px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: 0.15s;
}
.emr-item:hover {
  background: var(--card2);
}
.emr-item.sel {
  background: var(--primary-bg);
  border-color: var(--primary);
}
.emr-item .ed {
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  color: var(--text-2);
  white-space: nowrap;
}
.emr-item .ed small {
  font-weight: 400;
  color: var(--green);
}
.empty {
  padding: 30px;
  text-align: center;
  color: var(--text-mute);
  font-size: 12.5px;
}
.empty-card {
  align-items: center;
  justify-content: center;
  color: var(--text-mute);
  font-size: 13px;
}
.prev-hd {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}
.ptabs {
  display: flex;
  gap: 2px;
  padding: 8px 16px 0;
}
.ptab {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-mute);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: 0.15s;
}
.ptab:hover {
  color: var(--primary);
}
.ptab.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}
.ptab-n {
  margin-left: 4px;
  font-size: 11px;
  background: var(--card2);
  padding: 1px 7px;
  border-radius: 9px;
}
.visit-row-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px 0;
}
.visit-row {
  display: flex;
  gap: 6px;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 4px;
  scrollbar-width: thin;
  /* 日期 chips 不换行：超出部分横向滚动，不挤压页面高度 */
  flex-wrap: nowrap;
  white-space: nowrap;
}
.visit-row::-webkit-scrollbar {
  height: 5px;
}
.visit-row::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 4px;
}
.visit-chip {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 14px;
  background: var(--card2);
  border: 1px solid var(--border);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.visit-chip.active {
  border-color: var(--primary);
  color: var(--primary);
  font-weight: 600;
}
.visit-count {
  flex-shrink: 0;
  font-size: 11.5px;
  color: var(--text-mute);
  white-space: nowrap;
}
.dot-done {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--green);
}
.prev-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
.prev-ft {
  display: flex;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid var(--border);
}
.prev-ft .btn-primary:last-child {
  margin-left: auto;
}
.block {
  margin-bottom: 12px;
}
.bl {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-mute);
  letter-spacing: 1px;
  margin: 14px 0 8px;
}
.bb {
  font-size: 13.5px;
  line-height: 1.7;
  word-break: break-all;
  overflow-wrap: anywhere;
}
.block.hl {
  background: var(--primary-bg);
  border-radius: 12px;
  padding: 12px 14px;
}
/* 处方笺版式 */
.rx-pad {
  margin: 4px auto 16px;
  max-width: 560px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px 26px;
  box-shadow: var(--shadow);
}
.rx-title {
  text-align: center;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 8px;
  margin-bottom: 16px;
}
.rx-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 22px;
  font-size: 12.5px;
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--border-strong);
}
.rx-dx {
  margin-top: 10px;
  font-size: 13px;
  font-weight: 600;
}
.rx-rp {
  margin-top: 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
  min-height: 96px;
}
.rx-rp-h {
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 6px;
}
.rx-item {
  font-size: 13px;
  line-height: 1.9;
}
.rx-empty {
  color: var(--text-mute);
  font-size: 12px;
}
.rx-sign {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  font-size: 13px;
}
</style>
