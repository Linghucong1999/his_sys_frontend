<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePatientStore } from '@/stores/patient'
import { listRecords, saveRecord, signRecord } from '@/api/emr'
import { listDictionaries } from '@/api/misc'
import PatientJourney from '@/components/PatientJourney.vue'
import type { JourneyNode } from '@/components/PatientJourney.vue'
import EmrBlock from '@/components/EmrBlock.vue'
import AiCopilotPanel from '@/components/AiCopilotPanel.vue'
import type { DiagnosisItem, MedicalRecord } from '@/api/types'
import { buildRecordPrintHtml } from '@/utils/print'
import PrintPreviewDialog from '@/components/PrintPreviewDialog.vue'

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
  prescriptionSummary: ''
})

const icdOptions = ref<Array<{ code: string; name: string }>>([])

const patient = computed(() => patientStore.current)
const signed = computed(() => currentRecord.value?.signed ?? false)

/** 就诊旅程五节点（对齐 UI 稿演示流程） */
const journeyNodes = computed<JourneyNode[]>(() => {
  const today = patientStore.visits.find((v) => {
    const d = new Date(v.visitedAt)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })
  const base = today ? new Date(today.visitedAt) : new Date()
  const fmtT = (d: Date): string =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return [
    { time: fmtT(base), label: '建档 · 首诊（医师创建）', state: 'done' },
    { time: fmtT(new Date(base.getTime() + 18 * 60000)), label: '体征录入 · T 38.2℃ P 92', state: 'done' },
    { time: fmtT(new Date(base.getTime() + 54 * 60000)), label: '接诊 · 病历已 CA 签名', state: signed.value ? 'done' : 'current' },
    { time: signed.value ? fmtT(new Date(base.getTime() + 70 * 60000)) : '进行中', label: '处方审核 · 待 CA 签名', state: 'current' },
    { time: '待进行', label: '缴费 · 药房取药', state: 'todo' }
  ]
})

async function loadIcd(): Promise<void> {
  icdOptions.value = await listDictionaries('icd10')
}

async function loadRecord(): Promise<void> {
  if (!patient.value) return
  const records = await listRecords({ keyword: patient.value.name })
  const latest = records.find((r) => r.type === 'outpatient' && !r.signed) ?? records[0] ?? null
  currentRecord.value = latest
  if (latest) {
    form.value = {
      chiefComplaint: latest.chiefComplaint ?? '',
      presentIllness: latest.presentIllness ?? '',
      pastHistory: latest.pastHistory ?? '',
      physicalExam: latest.physicalExam ?? '',
      diagnosisText: latest.diagnosis?.map((d) => `${d.code} ${d.name}`).join('；') ?? '',
      prescriptionSummary: latest.prescriptionSummary ?? ''
    }
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

async function onSave(): Promise<void> {
  if (!patient.value) return
  busy.value = true
  errorMsg.value = ''
  try {
    const payload = {
      patientId: patient.value._id,
      patientName: patient.value.name,
      type: 'outpatient' as const,
      department: '呼吸内科',
      chiefComplaint: form.value.chiefComplaint,
      presentIllness: form.value.presentIllness,
      pastHistory: form.value.pastHistory,
      physicalExam: form.value.physicalExam,
      diagnosis: parseDiagnosis(form.value.diagnosisText),
      prescriptionSummary: form.value.prescriptionSummary
    }
    if (currentRecord.value && !currentRecord.value.signed) {
      currentRecord.value = await saveRecord(payload).then(() => currentRecord.value)
      // 后端 save 无 id 时新建；编辑已存在记录走 update
      const { updateRecord } = await import('@/api/emr')
      currentRecord.value = await updateRecord(currentRecord.value!._id, payload)
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
  if (!currentRecord.value) {
    await onSave()
  }
  if (!currentRecord.value) return
  busy.value = true
  try {
    currentRecord.value = await signRecord(currentRecord.value._id)
    savedTip.value = '已 CA 签名'
  } catch (e) {
    errorMsg.value = (e as Error).message
  } finally {
    busy.value = false
  }
}

/** 打印当前病历：打开打印预览对话框（预览确认后打印） */
const previewVisible = ref(false)
const previewHtml = ref('')
const previewTitle = ref('')

function onPrint(): void {
  if (!patient.value) return
  const draft: MedicalRecord = {
    _id: currentRecord.value?._id ?? 'draft',
    recordNo: currentRecord.value?.recordNo ?? '未归档',
    type: 'outpatient',
    patientId: patient.value._id,
    patientName: patient.value.name,
    department: '呼吸内科',
    doctorName: '王医生',
    diagnosis: parseDiagnosis(form.value.diagnosisText),
    chiefComplaint: form.value.chiefComplaint,
    presentIllness: form.value.presentIllness,
    pastHistory: form.value.pastHistory,
    physicalExam: form.value.physicalExam,
    prescriptionSummary: form.value.prescriptionSummary,
    signed: signed.value,
    signedBy: currentRecord.value?.signedBy,
    signedAt: currentRecord.value?.signedAt
  }
  previewHtml.value = buildRecordPrintHtml(draft, patient.value)
  previewTitle.value = `门诊病历 · ${patient.value.name}`
  previewVisible.value = true
}

onMounted(() => {
  if (!patientStore.current) {
    router.replace('/workbench')
    return
  }
  void loadIcd()
  void loadRecord()
})

watch(() => patientStore.current, () => void loadRecord())
</script>

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
          <span class="tag tag-blue">医保：市职工</span>
          <span v-if="form.pastHistory.includes('过敏')" class="tag tag-red">⚠ 过敏史</span>
          <span v-else class="tag tag-green">无过敏史</span>
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
          <textarea v-model="form.chiefComplaint" class="inp plain" placeholder="主诉…"></textarea>
        </EmrBlock>
        <EmrBlock v-if="tab === 'record'" label="现病史" ai="✨ 语音转写">
          <textarea v-model="form.presentIllness" class="inp plain" placeholder="现病史…"></textarea>
        </EmrBlock>
        <div v-if="tab === 'record'" class="two-col">
          <EmrBlock label="既往史">
            <textarea v-model="form.pastHistory" class="inp plain" placeholder="既往史…"></textarea>
          </EmrBlock>
          <EmrBlock label="体格检查">
            <textarea v-model="form.physicalExam" class="inp plain" placeholder="体格检查…"></textarea>
          </EmrBlock>
        </div>
        <EmrBlock v-if="tab === 'record'" label="初步诊断" ai="ICD-10 智能匹配" highlight>
          <input
            v-model="form.diagnosisText"
            class="inp plain"
            list="icd-list"
            placeholder="输入诊断，如：J15.9 社区获得性肺炎，非重症"
          />
          <datalist id="icd-list">
            <option v-for="d in icdOptions" :key="d.code" :value="`${d.code} ${d.name}`"></option>
          </datalist>
        </EmrBlock>
        <EmrBlock v-if="tab === 'prescription'" label="处方内容" ai="用药安全校验">
          <textarea v-model="form.prescriptionSummary" class="inp plain" placeholder="处方内容…"></textarea>
        </EmrBlock>
        <EmrBlock v-if="tab === 'exam'" label="检查申请">
          <textarea class="inp plain" placeholder="检查项目与临床指征（第一版占位）"></textarea>
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
  <section v-else>
    <div class="card" style="padding: 60px; text-align: center; color: var(--text-mute)">
      请先从工作台「快速开始」建档或调档接诊，再进入患者 360° 工作站
      <div style="margin-top: 14px">
        <button class="btn btn-primary" @click="router.push('/workbench')">返回工作台</button>
      </div>
    </div>
  </section>
  <PrintPreviewDialog v-model:visible="previewVisible" :title="previewTitle" :print-html="previewHtml" />
</template>

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
@media (max-width: 1200px) {
  .p360 {
    grid-template-columns: 1fr;
  }
}
</style>
