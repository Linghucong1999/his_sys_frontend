<template>
  <section class="drugs-page">
    <div class="sec-hd">
      <div class="page-title">💊 药品说明书</div>
      <input
        v-model="keyword"
        class="inp"
        placeholder="🔍 输入药品名称，如：头孢 / 阿莫西林"
        style="width: 280px"
        @keydown.enter="load"
      />
      <button class="btn btn-ghost btn-sm" @click="load">搜索</button>
      <span class="sep"></span>
      <div class="cat-select">
        <ElSelect v-model="categoryFilter" class="his-ep-select" placeholder="药理分类" clearable @change="changeCategory">
          <ElOption value="" label="全部药理分类" />
          <ElOption v-for="c in categories" :key="c" :label="c" :value="c" />
        </ElSelect>
      </div>
      <span class="sep"></span>
      <div
        v-for="c in SOURCE_CHIPS"
        :key="c.value"
        class="chip"
        :class="{ active: sourceFilter === c.value }"
        @click="changeSource(c.value)"
      >
        {{ c.label }}
      </div>
      <span class="tag tag-blue" style="margin-left: auto">共 {{ drugs.length }} 种药品</span>
      <button class="btn btn-ghost btn-sm" @click="openUnknown">❓ 未知药品</button>
    </div>
    <div class="grid2">
      <!-- 左：药品列表 -->
      <div class="card left-card">
        <div class="drug-list">
          <div
            v-for="d in drugs"
            :key="d._id"
            class="drug-item"
            :class="{ sel: selected?._id === d._id }"
            @click="selected = d"
          >
            <div class="di">💊</div>
            <div class="tt">
              <b>{{ d.drugName }}</b>
              <small>{{ d.spec ?? '' }}</small>
            </div>
          </div>
          <div v-if="drugs.length === 0" class="empty">未找到药品，换一个关键词试试</div>
        </div>
      </div>
      <!-- 右：说明书详情 -->
      <div v-if="selected" class="card right-card">
        <div class="detail-hd">
          <b style="font-size: 18px">{{ selected.drugName }}</b>
          <span class="tag tag-blue">{{ selected.spec ?? '—' }}</span>
        </div>
        <div class="detail-body">
          <div class="row"><span class="lb">规格</span>{{ selected.spec ?? '—' }}</div>
          <div class="row"><span class="lb">数据来源</span>{{ selected.source === 'crawl' ? '爬虫采集' : selected.source === 'vbp-catalog' ? '集采目录' : selected.source === 'base-catalog' ? '基药目录' : '内置数据' }}</div>
          <div class="ins">
            <div class="ins-title">【说明书】</div>
            <p>{{ selected.fullText ?? selected.indications ?? '暂无说明书内容' }}</p>
          </div>
        </div>
        <div class="detail-ft">
          <button class="btn btn-ghost" @click="router.push('/p360')">去开处方</button>
        </div>
      </div>
      <div v-else class="card right-card empty-card">← 从左侧选择药品查看说明书</div>
    </div>

    <!-- 未知药品弹窗 -->
    <ElDialog v-model="unknownDialogVisible" title="❓ 未知药品（医生开过但药库没有）" width="560px">
      <div v-if="unknownDrugs.length === 0" class="unknown-empty">暂无未知药品</div>
      <div v-for="d in unknownDrugs" :key="d._id" class="unknown-row">
        <div class="tt">
          <b>{{ d.drugName }}</b>
          <small>被开具 {{ d.count }} 次 · {{ d.doctorName ?? '—' }} · 患者 {{ d.patientName ?? '—' }}</small>
        </div>
        <button class="btn btn-primary btn-sm" @click="onRegisterDrug(d)">注册入库</button>
      </div>
    </ElDialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchDrugManuals, fetchDrugCategories, fetchUnknownDrugs, registerDrug } from '@/api/misc'
import { ElSelect, ElOption, ElDialog, ElMessageBox } from 'element-plus'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/option/style/css'
import 'element-plus/es/components/dialog/style/css'
import 'element-plus/es/components/message-box/style/css'
import type { DrugManual, UnknownDrug } from '@/api/types'

const route = useRoute()
const router = useRouter()
const keyword = ref('')
const sourceFilter = ref<'all' | 'seed' | 'base-catalog' | 'vbp-catalog'>('all')
const categoryFilter = ref('')
const categories = ref<string[]>([])
const drugs = ref<DrugManual[]>([])
const selected = ref<DrugManual | null>(null)

const SOURCE_CHIPS = [
  { value: 'all', label: '全部' },
  { value: 'seed', label: '📖 有说明书' },
  { value: 'base-catalog', label: '基药目录' },
  { value: 'vbp-catalog', label: '集采目录' }
] as const

async function load(): Promise<void> {
  drugs.value = await fetchDrugManuals(
    keyword.value.trim() || undefined,
    sourceFilter.value === 'all' ? undefined : sourceFilter.value,
    categoryFilter.value || undefined
  )
  // Cmd+K 跳转带 name 参数时自动选中
  const name = route.query.name
  if (typeof name === 'string' && name) {
    selected.value = drugs.value.find((d) => d.drugName === name) ?? drugs.value[0] ?? null
  } else if (!selected.value || !drugs.value.some((d) => d._id === selected.value?._id)) {
    selected.value = drugs.value[0] ?? null
  }
}

function changeSource(s: typeof sourceFilter.value): void {
  sourceFilter.value = s
  selected.value = null
  void load()
}

function changeCategory(c: string): void {
  categoryFilter.value = c
  selected.value = null
  void load()
}

/** 未知药品（医生开过但药库没有） */
const unknownDialogVisible = ref(false)
const unknownDrugs = ref<UnknownDrug[]>([])

async function openUnknown(): Promise<void> {
  unknownDrugs.value = await fetchUnknownDrugs()
  unknownDialogVisible.value = true
}

async function onRegisterDrug(d: UnknownDrug): Promise<void> {
  try {
    await registerDrug({ drugName: d.drugName })
    unknownDrugs.value = unknownDrugs.value.filter((u) => u._id !== d._id)
    await ElMessageBox.alert(
      `「${d.drugName}」已注册入库，并按药理词根自动分类。可补充规格与说明书。`,
      '注册成功',
      { confirmButtonText: '知道了', type: 'success' }
    )
    void load()
  } catch (e) {
    await ElMessageBox.alert((e as Error).message, '注册失败', { confirmButtonText: '知道了', type: 'error' })
  }
}

onMounted(() => {
  void load()
  void fetchDrugCategories().then((list) => {
    categories.value = list
  })
})

onMounted(() => {
  void load()
})
</script>

<style scoped>
.drugs-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.grid2 {
  display: grid;
  grid-template-columns: 300px 1fr;
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
.drug-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.drug-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 13px;
  border-radius: 12px;
  cursor: pointer;
  transition: 0.15s;
  border: 1px solid transparent;
}
.drug-item:hover {
  background: var(--card2);
}
.drug-item.sel {
  background: var(--primary-soft);
  border-color: var(--primary);
}
.di {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--card2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.tt {
  flex: 1;
  min-width: 0;
}
.tt b {
  font-size: 13px;
  display: block;
}
.tt small {
  color: var(--text-mute);
  font-size: 11.5px;
}
.empty {
  padding: 30px;
  text-align: center;
  color: var(--text-mute);
  font-size: 12.5px;
}
.right-card {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.detail-hd {
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.detail-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 22px;
}
.row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--text-sub);
}
.lb {
  width: 76px;
  color: var(--text-mute);
  flex-shrink: 0;
}
.ins {
  margin-top: 14px;
}
.ins-title {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 10px;
}
.ins p {
  background: var(--card2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px 16px;
  line-height: 1.9;
  font-size: 13px;
  color: var(--text-sub);
}
.detail-ft {
  padding: 14px 22px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}
.empty-card {
  align-items: center;
  justify-content: center;
  color: var(--text-mute);
  font-size: 13px;
}
.cat-select {
  width: 200px;
}
.unknown-empty {
  padding: 30px;
  text-align: center;
  color: var(--text-mute);
  font-size: 12.5px;
}
.unknown-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 13px;
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 8px;
}
.unknown-row .tt {
  flex: 1;
  min-width: 0;
}
.unknown-row .tt b {
  display: block;
  font-size: 13.5px;
}
.unknown-row .tt small {
  color: var(--text-mute);
  font-size: 11.5px;
}
</style>
