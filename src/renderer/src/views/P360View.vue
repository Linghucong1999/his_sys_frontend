<template>
  <section v-if="patient">
    <div class="p360">
      <!-- 左：患者卡 + 旅程 -->
      <div class="card pcard">
        <div style="display: flex; gap: 12px; align-items: center">
          <div class="pava">{{ patient.name[0] }}</div>
          <div>
            <div style="font-size: 16px; font-weight: 700">{{ patient.name }}</div>
            <div style="font-size: 11.5px; color: var(--text-mute)">
              {{ patient.gender ?? '未知' }} · 档案号 {{ patient.medicalRecordNo ?? patient.empiId }}
            </div>
          </div>
        </div>
        <div class="tags" style="margin-top: 12px">
          <span class="tag tag-blue">医保：{{ patient.insuranceType ?? '自费' }}</span>
          <span v-if="form.pastHistory.includes('过敏')" class="tag tag-red">⚠ 过敏史</span>
          <span v-else class="tag tag-green">无过敏史</span>
        </div>
        <div style="margin-top: 12px">
          <button class="btn btn-ghost btn-sm" @click="goPatientList">🔁 返回患者列表</button>
        </div>
        <div class="ai-sec" style="margin-top: 16px">就诊旅程</div>
        <PatientJourney :nodes="journeyNodes" />
      </div>

      <!-- 中：区块化病历编辑器 -->
      <div class="card editor">
        <div class="editor-hd">
          <div class="tabs">
            <div class="tab" :class="{ active: tab === 'record' }" @click="tab = 'record'">门诊病历</div>
            <div class="tab" :class="{ active: tab === 'prescription' }" @click="tab = 'prescription'">处方</div>
            <div class="tab" :class="{ active: tab === 'exam' }" @click="tab = 'exam'">检查申请</div>
          </div>
          <span class="tag" :class="signed ? 'tag-green' : 'tag-orange'" style="margin-left: auto">
            {{ signed ? `🔏 已 CA 签名 ${currentRecord?.signedBy ?? ''}` : savedTip || '草稿未签名' }}
          </span>
        </div>

        <EmrBlock v-if="tab === 'record'" label="主诉" ai="✨ AI 生成">
          <AutoTextarea v-model="form.chiefComplaint" placeholder="主诉…" />
        </EmrBlock>
        <EmrBlock v-if="tab === 'record'" label="现病史" ai="✨ 语音转写">
          <AutoTextarea v-model="form.presentIllness" placeholder="现病史…" />
        </EmrBlock>
        <div v-if="tab === 'record'" class="two-col">
          <EmrBlock label="既往史">
            <AutoTextarea v-model="form.pastHistory" placeholder="既往史…" />
          </EmrBlock>
          <EmrBlock label="体格检查">
            <AutoTextarea v-model="form.physicalExam" placeholder="体格检查…" />
          </EmrBlock>
        </div>
        <EmrBlock v-if="tab === 'record'" label="初步诊断" ai="ICD-10 智能匹配" highlight>
          <ElAutocomplete
            v-model="form.diagnosisText"
            class="his-ep-select"
            placeholder="输入诊断，或从下拉选择 ICD-10（多个诊断以「；」分隔）"
            :fetch-suggestions="queryIcd"
            @select="onIcdSelect"
          />
        </EmrBlock>
        <EmrBlock v-if="tab === 'prescription'" label="处方表单" ai="药品联想输入">
          <div class="rx-form">
            <div v-for="(row, i) in rxRows" :key="i" class="rx-row">
              <ElAutocomplete
                v-model="row.drug"
                class="rx-drug"
                placeholder="药品名（输入联想）"
                :fetch-suggestions="queryDrugs"
                @select="(item) => onDrugSelect(item, row)"
              />
              <ElInput v-model="row.spec" class="rx-spec" placeholder="规格" />
              <ElInput v-model="row.dose" class="rx-dose" placeholder="剂量" />
              <ElSelect v-model="row.frequency" class="rx-freq" placeholder="频次" clearable>
                <ElOption v-for="f in FREQ_OPTIONS" :key="f.value" :label="f.label" :value="f.value" />
              </ElSelect>
              <ElSelect v-model="row.route" class="rx-route" placeholder="途径" clearable>
                <ElOption v-for="r in ROUTE_OPTIONS" :key="r" :label="r" :value="r" />
              </ElSelect>
              <ElInput v-model="row.duration" class="rx-dur" placeholder="疗程(如7天)" />
              <button class="btn btn-ghost btn-sm rx-del" @click="removeRxRow(i)">✕</button>
            </div>
            <button class="btn btn-ghost btn-sm" @click="addRxRow">＋ 添加药品</button>
            <div v-if="form.prescriptionSummary" class="legacy-rx">
              <div class="legacy-rx-title">📜 历次处方摘要（续写累积，含时间戳）</div>
              <div class="legacy-rx-body">{{ form.prescriptionSummary }}</div>
            </div>
          </div>
        </EmrBlock>
        <EmrBlock v-if="tab === 'exam'" label="检查申请">
          <AutoTextarea v-model="form.examRequest" placeholder="检查项目与临床指征（CA 签名前必填）" />
        </EmrBlock>

        <div v-if="errorMsg" class="err">{{ errorMsg }}</div>
        <div class="editor-ft">
          <button class="btn btn-ghost">存为模板</button>
          <button class="btn btn-ghost" @click="onPrint">打印</button>
          <button class="btn btn-ghost" :disabled="busy" @click="onSave">保存</button>
          <button class="btn btn-primary" :disabled="busy || signed" @click="onSign">
            {{ signed ? '已 CA 签名' : '🔏 CA 签名并完成接诊' }}
          </button>
        </div>
      </div>

      <!-- 右：AI 辅助面板 -->
      <AiCopilotPanel
        :diagnoses="[
          { name: '社区获得性肺炎', conf: 87 },
          { name: '急性支气管炎', conf: 64 },
          { name: '上呼吸道感染', conf: 41 }
        ]"
        :warnings="[
          '<b>禁用青霉素类</b>：患者青霉素过敏史，阿莫西林已被智能替换为左氧氟沙星。'
        ]"
        :tips="['头孢呋辛与当前诊断匹配，无相互作用风险。']"
      />
    </div>
  </section>
  <section v-else class="list-view">
    <div class="sec-hd">
      <div class="page-title">🔁 复诊调档 · 就诊患者一览</div>
      <span class="tag tag-blue">共 {{ allPatients.length }} 位患者 · 按最新建档排序</span>
      <div style="margin-left: auto">
        <button class="btn btn-ghost" @click="router.push('/workbench')">返回工作台</button>
      </div>
    </div>
    <div class="card" style="padding: 12px">
      <div v-for="p in allPatients" :key="p._id" class="qs-result">
        <div class="p-ava">{{ p.name[0] }}</div>
        <div style="flex: 1; min-width: 0">
          <b style="font-size: 13.5px">{{ p.name }}</b>
          <span style="color: var(--text-mute); font-size: 11.5px">
            {{ p.gender ?? '未知' }} · {{ ageOf(p.birthDate) || '—' }} · {{ p.phone ?? '' }}
          </span>
          <div style="font-size: 11.5px; color: var(--text-mute); margin-top: 2px">
            档案号 {{ p.medicalRecordNo ?? p.empiId }}
          </div>
        </div>
        <template v-if="p.pending && p.pending.length > 0">
          <button
            v-for="(item, i) in p.pending"
            :key="i"
            class="btn btn-sm pending-btn"
            :class="i === 0 ? 'btn-primary' : 'btn-ghost'"
            :disabled="followupBusy"
            @click="onResumeFromList(p)"
          >
            {{ item }}
          </button>
        </template>
        <button
          v-else
          class="btn btn-primary btn-sm"
          :disabled="followupBusy"
          @click="onFollowupFromList(p)"
        >
          调档接诊
        </button>
      </div>
      <div v-if="allPatients.length === 0" style="padding: 30px; text-align: center; color: var(--text-mute)">
        暂无患者档案
      </div>
      <!-- 分页控件：每页 10 条 -->
      <Pagination :page="patientPage" :total="patientTotal" :page-size="PAGE_SIZE" @change="goPage" />
    </div>
  </section>
  <PrintPreviewDialog v-model:visible="previewVisible" :title="previewTitle" :print-html="previewHtml" />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePatientStore, TAB_OF_PENDING } from '@/stores/patient'
import { listRecords, saveRecord, signRecord } from '@/api/emr'
import { listDictionaries } from '@/api/misc'
import { fetchPatientPage } from '@/api/patients'
import PatientJourney from '@/components/PatientJourney.vue'
import type { JourneyNode } from '@/components/PatientJourney.vue'
import EmrBlock from '@/components/EmrBlock.vue'
import AiCopilotPanel from '@/components/AiCopilotPanel.vue'
import type { DiagnosisItem, MedicalRecord, RxItem, Patient } from '@/api/types'
import { buildRecordPrintHtml } from '@/utils/print'
import PrintPreviewDialog from '@/components/PrintPreviewDialog.vue'
import Pagination from '@/components/Pagination.vue'
import AutoTextarea from '@/components/AutoTextarea.vue'
import { ElMessageBox, ElAutocomplete, ElSelect, ElOption, ElInput } from 'element-plus'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/autocomplete/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/option/style/css'
import 'element-plus/es/components/input/style/css'

/** 统一错误弹窗 */
function alertError(msg: string, title = '操作失败'): void {
  void ElMessageBox.alert(msg, title, { confirmButtonText: '知道了', type: 'error' })
}

const router = useRouter()
const patientStore = usePatientStore()

const tab = ref<'record' | 'prescription' | 'exam'>('record')
const savedTip = ref('')
const busy = ref(false)
const errorMsg = ref('')

const currentRecord = ref<MedicalRecord | null>(null)
const form = ref({
  chiefComplaint: '',
  presentIllness: '',
  pastHistory: '',
  physicalExam: '',
  diagnosisText: '',
  prescriptionSummary: '',
  examRequest: ''
})

const icdOptions = ref<Array<{ code: string; name: string }>>([])

/** 处方表单：药品联想 + 结构化条目 */
const drugOptions = ref<Array<{ value: string; spec?: string }>>([])
const rxRows = ref<RxItem[]>([{ drug: '' }])
const FREQ_OPTIONS = [
  { value: 'qd', label: 'qd（每日一次）' },
  { value: 'bid', label: 'bid（每日两次）' },
  { value: 'tid', label: 'tid（每日三次）' },
  { value: 'qid', label: 'qid（每日四次）' },
  { value: 'q8h', label: 'q8h（每8小时）' },
  { value: 'q12h', label: 'q12h（每12小时）' },
  { value: 'qn', label: 'qn（每晚）' },
  { value: 'prn', label: 'prn（按需）' }
]
const ROUTE_OPTIONS = ['口服', '静脉滴注', '静脉注射', '肌肉注射', '雾化吸入', '外用', '舌下含服']

function queryDrugs(query: string, cb: (list: Array<{ value: string; spec?: string }>) => void): void {
  const kw = (query ?? '').trim().toLowerCase()
  const list = kw
    ? drugOptions.value.filter((d) => d.value.toLowerCase().includes(kw)).slice(0, 8)
    : drugOptions.value.slice(0, 8)
  cb(list)
}

/** ICD-10 联想（el-autocomplete 数据源） */
function queryIcd(query: string, cb: (list: Array<{ value: string }>) => void): void {
  const segs = form.value.diagnosisText.split(/[；;]/)
  const kw = (segs[segs.length - 1] ?? '').trim().toLowerCase()
  const list = icdOptions.value
    .filter((d) => !kw || d.name.toLowerCase().includes(kw) || d.code.toLowerCase().includes(kw))
    .slice(0, 8)
    .map((d) => ({ value: `${d.code} ${d.name}` }))
  cb(list)
}

/** 选择诊断：替换正在编辑片段并自动补齐「；」 */
function onIcdSelect(item: { value?: string }): void {
  const v = item.value ?? ''
  const trimmed = form.value.diagnosisText.trim()
  const segs = trimmed
    .split(/[；;]/)
    .map((s) => s.trim())
    .filter(Boolean)
  const done =
    trimmed === '' || trimmed.endsWith('；') || trimmed.endsWith(';') ? segs : segs.slice(0, -1)
  form.value.diagnosisText = [...done, v].join('；') + '；'
}

function onDrugSelect(item: { value?: string; spec?: string }, row: RxItem): void {
  row.drug = item.value ?? row.drug
  row.spec = row.spec ?? item.spec ?? ''
}

function addRxRow(): void {
  rxRows.value.push({ drug: '' })
}

function removeRxRow(i: number): void {
  if (rxRows.value.length > 1) rxRows.value.splice(i, 1)
}

/** 有效处方条目（药名非空） */
const validRxRows = computed(() => rxRows.value.filter((r) => r.drug.trim()))

/** 生成兼容文本摘要：药名 剂量 途径 频次 ×疗程 */
function rxSummaryOf(rows: RxItem[]): string {
  return rows
    .filter((r) => r.drug.trim())
    .map((r) => {
      const dose = r.dose ?? r.spec ?? ''
      const route = r.route ? ` ${r.route}` : ''
      const freq = r.frequency ? ` ${r.frequency}` : ''
      const dur = r.duration ? ` ×${r.duration}` : ''
      return `${r.drug} ${dose}${route}${freq}${dur}`.replace(/\s+/g, ' ').trim()
    })
    .join('；')
}

const rxSummary = computed(() => rxSummaryOf(rxRows.value))

/** 复诊调档回填的原始处方文本：与回填内容相同时不重复写入处方摘要 */
let baselineRx = ''

const patient = computed(() => patientStore.current)
const signed = computed(() => currentRecord.value?.signed ?? false)

/** 就诊旅程节点（CA 签名即流程结束，无处方审核/药房环节） */
const journeyNodes = computed<JourneyNode[]>(() => {
  const today = patientStore.visits.find((v) => {
    const d = new Date(v.visitedAt)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })
  const doctor = today?.doctorName ?? '—'
  const base = today ? new Date(today.visitedAt) : new Date()
  const fmtT = (d: Date): string =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return [
    { time: fmtT(base), label: `建档 · 接诊（${doctor}）`, state: 'done' },
    { time: fmtT(new Date(base.getTime() + 18 * 60000)), label: '体征录入 · T 38.2℃ P 92', state: 'done' },
    {
      time: signed.value ? fmtT(new Date(base.getTime() + 54 * 60000)) : '进行中',
      label: signed.value ? '接诊 · 病历已 CA 签名 · 流程结束' : '接诊 · 病历待 CA 签名',
      state: signed.value ? 'done' : 'current'
    }
  ]
})

async function loadIcd(): Promise<void> {
  icdOptions.value = await listDictionaries('icd10')
  const drugs = await listDictionaries('drug')
  drugOptions.value = drugs.map((d) => ({
    value: d.name,
    spec: (d.extra as Record<string, string> | undefined)?.spec ?? ''
  }))
}

async function loadRecord(): Promise<void> {
  if (!patient.value) return
  const records = await listRecords({ keyword: patient.value.name })
  const unsorted = records.filter((r) => r.type === 'outpatient')
  const sorted = [...unsorted].sort(
    (a, b) => new Date(b.createdAt ?? b.visitedAt ?? 0).getTime() - new Date(a.createdAt ?? a.visitedAt ?? 0).getTime()
  )
  // 复诊调档：优先取"进行中就诊"关联的未签名病历续写；
  // 其次取最近已签名病历（复诊续方）；最后兜底取最近门诊病历（避免历史病历查不到时空白）
  const activeVisitIds = patientStore.visits.filter((v) => v.status === 'in_progress').map((v) => v._id)
  const activeUnsigned = sorted.find((r) => !r.signed && r.visitId && activeVisitIds.includes(r.visitId))
  const latest = activeUnsigned ?? sorted.find((r) => r.signed) ?? sorted[0] ?? null
  currentRecord.value = latest
  if (!latest) {
    // 无历史病历：重置为空白表单，避免残留上一个患者的病历/处方信息
    form.value = {
      chiefComplaint: '',
      presentIllness: '',
      pastHistory: '',
      physicalExam: '',
      diagnosisText: '',
      prescriptionSummary: '',
      examRequest: ''
    }
    rxRows.value = [{ drug: '' }]
    baselineRx = ''
    return
  }
  form.value = {
    chiefComplaint: latest.chiefComplaint ?? '',
    presentIllness: latest.presentIllness ?? '',
    pastHistory: latest.pastHistory ?? '',
    physicalExam: latest.physicalExam ?? '',
    diagnosisText: latest.diagnosis?.map((d) => `${d.code} ${d.name}`).join('；') ?? '',
    prescriptionSummary: latest.prescriptionSummary ?? '',
    examRequest: latest.examRequest ?? ''
  }
  // 处方回填：优先结构化条目
  if (latest.prescriptionItems && latest.prescriptionItems.length > 0) {
    rxRows.value = latest.prescriptionItems.map((r) => ({ ...r }))
    // 记录回填基线：医生未改动时不把旧处方重复追加进摘要
    baselineRx = rxSummaryOf(rxRows.value)
  } else {
    rxRows.value = [{ drug: '' }]
    baselineRx = ''
  }
}

function parseDiagnosis(text: string): DiagnosisItem[] {
  return text
    .split(/[；;]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const m = s.match(/^([A-Z]\d+(?:\.\d+)*)\s*(.*)$/)
      return m ? { code: m[1], name: m[2] || m[1] } : { code: '', name: s }
    })
}

/** 处方摘要累积：复诊续写时保留历史处方，本次处方带时间戳追加（同一分钟内去重） */
let appendedRxKey = ''

function stampNow(): string {
  const d = new Date()
  const p = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function buildSummaryWithHistory(): string {
  const cur = rxSummary.value.trim()
  const base = (form.value.prescriptionSummary ?? '').trim()
  if (!cur) return base
  // 复诊调档回填后未改动：不把旧处方重复追加进摘要
  if (baselineRx && cur === baselineRx) return base
  const entry = `【${stampNow()} 处方】 ${cur}`
  if (!base) {
    appendedRxKey = entry
    return entry
  }
  // 最后一段已含本次处方（自动保存重复触发）则不改
  const lastLine = base.split('\n').pop() ?? ''
  if (lastLine === entry || lastLine.endsWith(cur)) {
    appendedRxKey = entry
    return base
  }
  appendedRxKey = entry
  return `${base}\n${entry}`
}

async function onSave(): Promise<void> {
  if (!patient.value) return
  busy.value = true
  errorMsg.value = ''
  try {
    const activeVisit = patientStore.visits.find((v) => v.status === 'in_progress')
    const payload = {
      patientId: patient.value._id,
      patientName: patient.value.name,
      type: 'outpatient' as const,
      department: '呼吸内科',
      visitId: activeVisit?._id,
      chiefComplaint: form.value.chiefComplaint,
      presentIllness: form.value.presentIllness,
      pastHistory: form.value.pastHistory,
      physicalExam: form.value.physicalExam,
      diagnosis: parseDiagnosis(form.value.diagnosisText),
      prescriptionSummary: buildSummaryWithHistory(),
      prescriptionItems: validRxRows.value,
      examRequest: form.value.examRequest
    }
    if (currentRecord.value && !currentRecord.value.signed) {
      // 编辑已存在的未签名档案：更新而非新建（修复重复建档）
      const { updateRecord } = await import('@/api/emr')
      currentRecord.value = await updateRecord(currentRecord.value._id, payload)
    } else {
      currentRecord.value = await saveRecord(payload)
    }
    savedTip.value = `已自动保存 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  } catch (e) {
    errorMsg.value = (e as Error).message
  } finally {
    busy.value = false
  }
}

async function onSign(): Promise<void> {
  if (!currentRecord.value || !signed.value) {
    // 签名前先把最新内容保存入库（含处方摘要累积）
    await onSave()
  }
  if (!currentRecord.value) return
  // CA 签名前置条件：门诊病历 / 处方 / 检查申请 三者缺一不可（不满足弹窗提示）
  const missing: string[] = []
  if (!form.value.chiefComplaint.trim()) missing.push('门诊病历（主诉未填写）')
  if (!(rxSummary.value || form.value.prescriptionSummary.trim())) missing.push('处方')
  if (!form.value.examRequest.trim()) missing.push('检查申请')
  if (missing.length > 0) {
    await ElMessageBox.alert(
      `以下内容未完成，不可 CA 签名：${missing.join('、')}`,
      '无法 CA 签名',
      { confirmButtonText: '知道了', type: 'warning' }
    )
    return
  }
  busy.value = true
  try {
    currentRecord.value = await signRecord(currentRecord.value._id)
    savedTip.value = '已 CA 签名'
  } catch (e) {
    await ElMessageBox.alert((e as Error).message, '签名失败', {
      confirmButtonText: '知道了',
      type: 'error'
    })
  } finally {
    busy.value = false
  }
}

/** 打印当前单据：按 tab 分流——病历/处方笺/检查申请单（预览确认后打印） */
const previewVisible = ref(false)
const previewHtml = ref('')
const previewTitle = ref('')

function onPrint(): void {
  if (!patient.value) return
  const diagnosis = parseDiagnosis(form.value.diagnosisText)
  const base: MedicalRecord = {
    _id: currentRecord.value?._id ?? 'draft',
    recordNo: currentRecord.value?.recordNo ?? '未归档',
    type: 'outpatient',
    patientId: patient.value._id,
    patientName: patient.value.name,
    department: '呼吸内科',
    doctorName: '王医生',
    diagnosis,
    signed: signed.value,
    signedBy: currentRecord.value?.signedBy,
    signedAt: currentRecord.value?.signedAt
  }
  if (tab.value === 'prescription') {
    // 处方笺：结构化条目优先，回退摘要文本
    const draft: MedicalRecord = {
      ...base,
      type: 'prescription',
      prescriptionItems: validRxRows.value.map((r) => ({
        drug: r.drug,
        spec: r.spec,
        dose: r.dose,
        frequency: r.frequency,
        route: r.route,
        duration: r.duration
      })),
      prescriptionSummary: rxSummary.value
    }
    previewHtml.value = buildRecordPrintHtml(draft, patient.value)
    previewTitle.value = `处方笺 · ${patient.value.name}`
  } else if (tab.value === 'exam') {
    // 检查申请单
    const draft: MedicalRecord = {
      ...base,
      type: 'exam',
      examRequest: form.value.examRequest
    }
    previewHtml.value = buildRecordPrintHtml(draft, patient.value)
    previewTitle.value = `检查申请单 · ${patient.value.name}`
  } else {
    // 门诊病历
    const draft: MedicalRecord = {
      ...base,
      type: 'outpatient',
      chiefComplaint: form.value.chiefComplaint,
      presentIllness: form.value.presentIllness,
      pastHistory: form.value.pastHistory,
      physicalExam: form.value.physicalExam,
      prescriptionSummary: form.value.prescriptionSummary,
      examRequest: form.value.examRequest
    }
    previewHtml.value = buildRecordPrintHtml(draft, patient.value)
    previewTitle.value = `门诊病历 · ${patient.value.name}`
  }
  previewVisible.value = true
}

function ageOf(birthDate?: string): string {
  if (!birthDate) return ''
  const age = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365 * 86400000))
  return age > 0 ? `${age} 岁` : ''
}

/** 未接诊时：罗列全部就诊过的患者（每页 10 条翻页），支持随时调档接诊 */
const PAGE_SIZE = 10
const allPatients = ref<Patient[]>([])
const patientPage = ref(1)
const patientTotal = ref(0)
const followupBusy = ref(false)

const totalPages = computed(() => Math.max(1, Math.ceil(patientTotal.value / PAGE_SIZE)))

async function loadAllPatients(): Promise<void> {
  const result = await fetchPatientPage(patientPage.value, PAGE_SIZE)
  allPatients.value = result.items
  patientTotal.value = result.total
}

async function goPage(p: number): Promise<void> {
  if (p < 1 || p > totalPages.value || p === patientPage.value) return
  patientPage.value = p
  await loadAllPatients()
}

async function onFollowupFromList(p: Patient): Promise<void> {
  followupBusy.value = true
  try {
    await patientStore.followup(p)
  } catch (e) {
    alertError((e as Error).message)
  } finally {
    followupBusy.value = false
  }
}

/** 续写：接诊未完成，进入接诊并定位到缺失 tab */
async function onResumeFromList(p: Patient): Promise<void> {
  const pendingTab = p.pending?.length ? (TAB_OF_PENDING[p.pending[0]] ?? 'record') : 'record'
  await patientStore.resume(p, pendingTab)
}

/** 返回患者一览（接诊状态列表：未写处方/未写检查等可继续处理） */
function goPatientList(): void {
  patientPage.value = 1
  patientStore.reset()
  void loadAllPatients()
}

onMounted(() => {
  // 字典提前加载：从患者列表“续写”进入时 drugOptions 已就绪（否则处方联想无数据）
  void loadIcd()
  if (!patientStore.current) {
    void loadAllPatients()
  } else {
    // 续写跳转：应用目标 tab
    const target = patientStore.consumeTargetTab()
    if (target) {
      tab.value = target as typeof tab.value
    }
    void loadRecord()
  }
})

watch(
  () => patientStore.current,
  () => {
    if (patientStore.current) {
      // 续写跳转：进入患者时应用目标 tab（未写处方→处方、未写检查→检查申请）
      const target = patientStore.consumeTargetTab()
      if (target) {
        tab.value = target as typeof tab.value
      }
      void loadRecord()
    } else {
      patientPage.value = 1
      void loadAllPatients()
    }
  }
)
</script>

<style scoped>
.p360 {
  display: grid;
  grid-template-columns: 280px 1fr 300px;
  gap: 14px;
  align-items: start;
}
.pcard {
  padding: 18px;
}
.pava {
  width: 52px;
  height: 52px;
  border-radius: 15px;
  background: var(--grad);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
}
.tags {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}
.editor {
  padding: 0;
  overflow: hidden;
}
.editor-hd {
  padding: 15px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 10px;
}
.tabs {
  display: flex;
  gap: 4px;
  background: var(--card2);
  padding: 3px;
  border-radius: 10px;
}
.tab {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12.5px;
  color: var(--text-sub);
  cursor: pointer;
  transition: 0.15s;
}
.tab.active {
  background: var(--card);
  color: var(--primary);
  font-weight: 600;
  box-shadow: var(--shadow);
}
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin: 0 20px;
}
.two-col :deep(.block) {
  margin: 14px 0 0;
}
.plain {
  border: none;
  background: none;
  box-shadow: none;
  height: auto;
  min-height: 30px;
  padding: 0;
  font-size: 13.5px;
}
.plain:focus {
  box-shadow: none;
  border-color: transparent;
}
.err {
  margin: 0 20px;
  font-size: 12px;
  color: var(--red);
  background: var(--red-bg);
  padding: 8px 12px;
  border-radius: 9px;
}
.editor-ft {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 13px 20px;
  border-top: 1px solid var(--border);
}
/* 处方表单 */
.rx-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rx-row {
  display: grid;
  grid-template-columns: 1.6fr 1fr 0.9fr 1.1fr 1fr 1fr 36px;
  gap: 6px;
  align-items: center;
}
.rx-del {
  color: var(--red);
  padding: 0;
}
.legacy-rx {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-mute);
  background: var(--card2);
  border: 1px dashed var(--border-strong);
  border-radius: 8px;
  padding: 8px 10px;
}
.legacy-rx-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-2);
  margin-bottom: 4px;
}
.legacy-rx-body {
  white-space: pre-wrap;
  word-break: break-all;
  overflow-wrap: anywhere;
  line-height: 1.7;
}
@media (max-width: 1200px) {
  .p360 {
    grid-template-columns: 1fr;
  }
}
.list-view .qs-result {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 8px;
  transition: 0.15s;
  cursor: pointer;
}
.list-view .qs-result:hover {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}
.list-view .p-ava {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--grad);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
}
</style>
