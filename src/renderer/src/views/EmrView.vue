<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { listRecords, signRecord } from '@/api/emr'
import type { MedicalRecord } from '@/api/types'

const records = ref<MedicalRecord[]>([])
const selected = ref<MedicalRecord | null>(null)
const keyword = ref('')
const filter = ref<'all' | 'unsigned' | 'signed'>('all')
const busy = ref(false)

const filtered = computed(() => {
  let list = records.value
  if (filter.value === 'unsigned') list = list.filter((r) => !r.signed)
  if (filter.value === 'signed') list = list.filter((r) => r.signed)
  return list
})

async function load(): Promise<void> {
  records.value = await listRecords({ signed: filter.value === 'all' ? undefined : String(filter.value === 'signed') })
  if (!selected.value && records.value.length > 0) selected.value = records.value[0]
}

function fmt(d: string | undefined): string {
  if (!d) return ''
  const date = new Date(d)
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
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

onMounted(() => {
  void load()
})
</script>

<template>
  <section>
    <div class="sec-hd">
      <div class="page-title">📋 电子病历</div>
      <input
        v-model="keyword"
        class="inp"
        placeholder="🔍 姓名 + 手机号 / 档案号"
        style="width: 260px"
        @keydown.enter="load"
      />
      <div class="chip" :class="{ active: filter === 'all' }" @click="filter = 'all'; load()">全部</div>
      <div class="chip" :class="{ active: filter === 'unsigned' }" @click="filter = 'unsigned'; load()">待签名</div>
      <div class="chip" :class="{ active: filter === 'signed' }" @click="filter = 'signed'; load()">已签名</div>
    </div>
    <div class="grid2">
      <!-- 病历列表 -->
      <div class="card" style="padding: 12px">
        <div
          v-for="r in filtered"
          :key="r._id"
          class="emr-item"
          :class="{ sel: selected?._id === r._id }"
          @click="selected = r"
        >
          <div class="ed">{{ fmt(r.visitedAt) }}</div>
          <div class="tt" style="flex: 1; min-width: 0">
            <b style="font-size: 13px">{{ r.patientName }} · {{ r.diagnosis[0]?.name ?? '—' }}</b>
            <div style="font-size: 11.5px; color: var(--text-mute); margin-top: 1px">
              {{ r.type === 'prescription' ? '处方' : r.type === 'admission' ? '入院记录' : '门诊病历' }} · {{ r.department }}
            </div>
          </div>
          <span class="tag" :class="r.signed ? 'tag-green' : 'tag-orange'">{{ r.signed ? '已签名' : '待签名' }}</span>
        </div>
      </div>
      <!-- 病历预览 -->
      <div v-if="selected" class="card" style="padding: 0; overflow: hidden">
        <div style="padding: 15px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; flex-wrap: wrap">
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
        <div class="editor-ft">
          <button class="btn btn-ghost">🖨 打印</button>
          <button class="btn btn-ghost">复制为新病历模板</button>
          <button v-if="!selected.signed" class="btn btn-primary" :disabled="busy" @click="onSign">🔏 CA 签名</button>
          <button v-else class="btn btn-ghost" disabled>已签名</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.grid2 {
  display: grid;
  grid-template-columns: 330px 1fr;
  gap: 14px;
  align-items: start;
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
.editor-ft {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 13px 20px;
  border-top: 1px solid var(--border);
}
</style>
