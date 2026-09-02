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
      <span class="sep"></span>
      <div class="chip" :class="{ active: typeFilter === 'all' }" @click="changeTypeFilter('all')">全部类型</div>
      <div class="chip" :class="{ active: typeFilter === 'outpatient' }" @click="changeTypeFilter('outpatient')">门诊病历</div>
      <div class="chip" :class="{ active: typeFilter === 'prescription' }" @click="changeTypeFilter('prescription')">💊 处方</div>
      <div class="chip" :class="{ active: typeFilter === 'admission' }" @click="changeTypeFilter('admission')">入院记录</div>
      <span class="tag tag-blue" style="margin-left: auto">共 {{ total }} 条</span>
    </div>

    <!-- 左右模块随视窗高度自适应，内部滚动 -->
    <div class="grid2">
      <!-- 左侧：病历列表（分页） -->
      <div class="card left-card">
        <div class="emr-list">
          <div
            v-for="r in records"
            :key="r._id"
            class="emr-item"
            :class="{ sel: selected?._id === r._id }"
            @click="selected = r"
          >
            <div class="ed">{{ fmt(r.visitedAt) }}<br /><small>{{ isToday(r.visitedAt) ? '今日' : '' }}</small></div>
            <div class="tt" style="flex: 1; min-width: 0">
              <b style="font-size: 13px">{{ r.patientName }} · {{ r.diagnosis[0]?.name ?? '—' }}</b>
              <div style="font-size: 11.5px; color: var(--text-mute); margin-top: 1px">
                {{ r.type === 'prescription' ? '处方' : r.type === 'admission' ? '入院记录' : '门诊病历' }} · {{ r.department }}
              </div>
            </div>
            <span class="tag" :class="r.signed ? 'tag-green' : 'tag-orange'">{{ r.signed ? '已签名' : '待签名' }}</span>
          </div>
          <div v-if="records.length === 0" class="empty">暂无病历</div>
        </div>
        <Pagination :page="page" :total="total" :page-size="pageSize" @change="goPage" />
      </div>

      <!-- 右侧：病历预览（随高度滚动） -->
      <div v-if="selected" class="card right-card">
        <div class="prev-hd">
          <b style="font-size: 15px">
            {{ selected.type === 'prescription' ? '处方' : selected.type === 'admission' ? '入院记录' : '门诊病历' }} · {{ selected.patientName }}
          </b>
          <span class="tag tag-blue">{{ selected.recordNo }}</span>
          <span class="tag" :class="selected.signed ? 'tag-green' : 'tag-orange'">
            {{ selected.signed ? `🔏 已 CA 签名 ${selected.signedAt ? new Date(selected.signedAt).toLocaleString('zh-CN') : ''}` : '待签名' }}
          </span>
          <span style="margin-left: auto; font-size: 11.5px; color: var(--text-mute)">
            {{ fmtFull(selected.visitedAt) }} · {{ selected.doctorName }} · {{ selected.department }}
          </span>
        </div>
        <div class="prev-body">
          <!-- 处方类型：处方笺版式 -->
          <div v-if="selected.type === 'prescription'" class="rx-pad">
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
          <!-- 病历类型：区块版式 -->
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
        <div class="prev-ft">
          <button class="btn btn-ghost" :disabled="busy" @click="onPrint">🖨 打印</button>
          <button class="btn btn-ghost">复制为新病历模板</button>
          <button v-if="!selected.signed" class="btn btn-primary" :disabled="busy" @click="onSign">🔏 CA 签名</button>
          <button v-else class="btn btn-primary" @click="router.push('/p360')">🔁 复诊续方</button>
        </div>
      </div>
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
const selected = ref<MedicalRecord | null>(null)
const keyword = ref('')
const filter = ref<'all' | 'unsigned' | 'signed' | 'recent'>('all')
const typeFilter = ref<'all' | 'outpatient' | 'prescription' | 'admission'>('all')
const busy = ref(false)

const page = ref(1)
const total = ref(0)

/** 动态每页条数：按视窗高度计算（列表行高约 58px，头部/分页约 200px） */
const pageSize = computed(() => {
  const vh = windowHeight.value
  return Math.min(50, Math.max(5, Math.floor((vh - 210) / 58)))
})

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

/** 处方条目：按分号拆分 prescriptionSummary */
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
    type: typeFilter.value === 'all' ? undefined : typeFilter.value,
    page: page.value,
    pageSize: pageSize.value
  })
  records.value = result.items
  total.value = result.total
  // 保证选中项在当前页内
  if (!selected.value || !records.value.some((r) => r._id === selected.value?._id)) {
    selected.value = records.value[0] ?? null
  }
}

function changeFilter(f: typeof filter.value): void {
  filter.value = f
  page.value = 1
  void load()
}

function changeTypeFilter(f: typeof typeFilter.value): void {
  typeFilter.value = f
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

// 视窗尺寸变化：重算每页条数并从第一页重载
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
    selected.value = await signRecord(selected.value._id)
    await load()
  } finally {
    busy.value = false
  }
}

/** 🖨 打印选中病历：打开打印预览对话框（联查患者性别/年龄） */
const previewVisible = ref(false)
const previewHtml = ref('')
const previewTitle = ref('')

async function onPrint(): Promise<void> {
  if (!selected.value) return
  busy.value = true
  try {
    const patient = await fetchPatient(selected.value.patientId)
    previewHtml.value = buildRecordPrintHtml(selected.value, patient)
    const kind = selected.value.type === 'prescription' ? '处方' : selected.value.type === 'admission' ? '入院记录' : '门诊病历'
    previewTitle.value = `${kind} · ${selected.value.patientName}`
    previewVisible.value = true
  } catch (e) {
    alertError((e as Error).message)
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  // 支持 ?filter=unsigned（顶栏 CA 签名入口）预筛选
  const f = route.query.filter
  if (f === 'unsigned' || f === 'signed' || f === 'recent') {
    filter.value = f
  }
  void load()
})
</script>

<style scoped>
.emr-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}
/* 左右模块随视窗高度自适应 */
.grid2 {
  display: grid;
  grid-template-columns: 330px 1fr;
  gap: 14px;
  align-items: stretch;
  height: calc(100vh - 190px);
  min-height: 320px;
}
.left-card {
  display: flex;
  flex-direction: column;
  padding: 12px;
  overflow: hidden;
  height: 100%;
}
.emr-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.right-card {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.prev-hd {
  padding: 15px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.prev-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-bottom: 14px;
}
.prev-ft {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 13px 20px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
.emr-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px 13px;
  border-radius: 12px;
  cursor: pointer;
  transition: 0.15s;
  border: 1px solid transparent;
}
.emr-item:hover {
  background: var(--card2);
}
.emr-item.sel {
  background: var(--primary-soft);
  border-color: var(--primary);
}
.ed {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: var(--card2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--primary);
  flex-shrink: 0;
  text-align: center;
  line-height: 1.2;
}
.emr-item.sel .ed {
  background: var(--card);
}
.empty {
  padding: 30px;
  text-align: center;
  color: var(--text-mute);
  font-size: 12.5px;
}
.block {
  margin: 14px 20px;
  padding: 15px 17px;
  background: var(--card2);
  border: 1px solid var(--border);
  border-radius: 13px;
}
.block.hl {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}
.bl {
  font-size: 12px;
  color: var(--text-mute);
  margin-bottom: 7px;
}
.bb {
  font-size: 13.5px;
  line-height: 1.7;
}
/* 处方笺版式 */
.rx-pad {
  margin: 16px 20px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px 26px;
  box-shadow: var(--shadow);
  font-family: var(--font);
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
  margin: 12px 0;
  font-size: 13px;
  font-weight: 600;
}
.rx-rp {
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  padding: 14px 16px;
  min-height: 120px;
  background: #fdfdf8;
}
.rx-rp-h {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 8px;
}
.rx-item {
  font-size: 13px;
  line-height: 2;
}
.rx-empty {
  color: var(--text-mute);
  font-size: 12px;
  padding: 10px 0;
}
.rx-sign {
  margin-top: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12.5px;
}
.sep {
  width: 1px;
  height: 18px;
  background: var(--border-strong);
  margin: 0 4px;
}
</style>
