<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { listBeds, listOrders, stopOrder } from '@/api/inpatient'
import type { Bed, InpatientOrder } from '@/api/types'

const wards = ['呼吸内科病区', '心内科病区']
const activeWard = ref(wards[0])
const beds = ref<Bed[]>([])
const selectedBed = ref<Bed | null>(null)
const orders = ref<InpatientOrder[]>([])
const orderTab = ref<'long' | 'temp'>('long')
const busy = ref(false)

const filteredOrders = computed(() => orders.value.filter((o) => o.type === orderTab.value))

async function loadBeds(): Promise<void> {
  beds.value = await listBeds(activeWard.value)
  if (!selectedBed.value && beds.value.length > 0) {
    await selectBed(beds.value.find((b) => b.status === 'occupied') ?? beds.value[0])
  }
}

async function selectBed(bed: Bed): Promise<void> {
  selectedBed.value = bed
  orders.value = bed.status === 'occupied' ? await listOrders({ bedNo: bed.bedNo }) : []
}

async function onStop(id: string): Promise<void> {
  busy.value = true
  try {
    await stopOrder(id)
    if (selectedBed.value) orders.value = await listOrders({ bedNo: selectedBed.value.bedNo })
  } finally {
    busy.value = false
  }
}

const CATEGORY_TAG: Record<string, string> = { drug: '药物', nursing: '护理', exam: '检查' }
const CATEGORY_CLASS: Record<string, string> = {
  drug: 'tag-blue',
  nursing: 'tag-green',
  exam: 'tag-orange'
}

onMounted(() => {
  void loadBeds()
})
</script>

<template>
  <section>
    <div class="sec-hd">
      <div class="page-title">🛏 住院工作站</div>
      <div
        v-for="w in wards"
        :key="w"
        class="chip"
        :class="{ active: activeWard === w }"
        @click="activeWard = w; selectedBed = null; loadBeds()"
      >
        {{ w }}
      </div>
      <div style="margin-left: auto; display: flex; gap: 8px">
        <span class="tag tag-green">在床 {{ beds.filter((b) => b.status === 'occupied').length }}</span>
        <span class="tag tag-blue">今日新入 3</span>
        <span class="tag tag-orange">今日出院 2</span>
        <span class="tag tag-red">危重 1</span>
      </div>
    </div>
    <div class="grid2">
      <!-- 床位卡网格 -->
      <div class="card" style="padding: 18px">
        <div style="font-size: 13.5px; font-weight: 600; margin-bottom: 12px">
          床位一览
          <span style="font-size: 11.5px; color: var(--text-mute); font-weight: 400">点击卡片查看患者</span>
        </div>
        <div class="bed-grid">
          <div
            v-for="b in beds"
            :key="b._id"
            class="bed-card"
            :class="[b.flag === 'postop' ? 'postop' : '', b.flag === 'leaving' ? 'leaving' : '', b.status === 'empty' ? 'empty' : '', selectedBed?._id === b._id ? 'sel' : '']"
            @click="selectBed(b)"
          >
            <div class="bn">{{ b.bedNo }}</div>
            <div class="bp" :style="b.status === 'empty' ? 'color:var(--text-mute)' : ''">
              {{ b.status === 'occupied' ? `${b.patientName} · ${b.note ? '' : ''}` : '空床' }}
            </div>
            <div class="bd">{{ b.status === 'occupied' ? b.note : b.note }}</div>
          </div>
        </div>
      </div>
      <!-- 选中患者：医嘱 -->
      <div class="card" style="padding: 0; overflow: hidden">
        <div v-if="selectedBed && selectedBed.status === 'occupied'" style="padding: 15px 18px; border-bottom: 1px solid var(--border)">
          <div style="display: flex; align-items: center; gap: 10px">
            <b style="font-size: 15px">{{ selectedBed.patientName }}</b>
            <span class="tag tag-blue">{{ selectedBed.bedNo }}</span>
            <span class="tag tag-violet">{{ selectedBed.flag === 'postop' ? '术后' : '在院' }}</span>
            <span class="tag tag-red">一级护理</span>
          </div>
          <div style="font-size: 11.5px; color: var(--text-mute); margin-top: 4px">
            住院号 {{ selectedBed.admissionNo ?? '—' }} · {{ selectedBed.note }}
          </div>
        </div>
        <div v-else style="padding: 15px 18px; border-bottom: 1px solid var(--border)">
          <b style="font-size: 15px">{{ selectedBed?.bedNo ?? '未选择' }}</b>
          <span style="font-size: 11.5px; color: var(--text-mute); margin-left: 8px">
            {{ selectedBed?.status === 'empty' ? '空床 · ' + selectedBed.note : '请选择床位' }}
          </span>
        </div>
        <div class="editor-hd" style="border-bottom: 1px solid var(--border)">
          <div class="tabs">
            <div class="tab" :class="{ active: orderTab === 'long' }" @click="orderTab = 'long'">长期医嘱</div>
            <div class="tab" :class="{ active: orderTab === 'temp' }" @click="orderTab = 'temp'">临时医嘱</div>
          </div>
          <button class="btn btn-ghost btn-sm" style="margin-left: auto">＋ 新开医嘱</button>
        </div>
        <div style="padding: 14px 18px">
          <div v-for="o in filteredOrders" :key="o._id" class="order-row">
            <span class="tag" :class="CATEGORY_CLASS[o.category]">{{ CATEGORY_TAG[o.category] }}</span>
            <div class="ot">
              <b>{{ o.content }}</b>
              <small>{{ o.frequency ?? '' }} · {{ o.status === 'active' ? '执行中' : o.status }}</small>
            </div>
            <button v-if="o.status === 'active'" class="btn btn-ghost btn-sm stop" :disabled="busy" @click="onStop(o._id)">
              停嘱
            </button>
          </div>
          <div v-if="filteredOrders.length === 0" style="font-size: 12px; color: var(--text-mute); padding: 20px 0; text-align: center">
            暂无医嘱
          </div>
        </div>
        <div class="editor-ft">
          <button class="btn btn-ghost">查看检查报告</button>
          <button class="btn btn-primary">🔏 签名并下达医嘱</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.grid2 {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 14px;
  align-items: start;
}
.bed-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.bed-card {
  padding: 13px;
  border: 1px solid var(--border);
  border-radius: 13px;
  cursor: pointer;
  border-left: 4px solid var(--green);
  transition: 0.15s;
  background: var(--card);
}
.bed-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
.bed-card.sel {
  border-color: var(--primary);
  border-left-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}
.bed-card.postop {
  border-left-color: var(--violet);
}
.bed-card.leaving {
  border-left-color: var(--orange);
}
.bed-card.empty {
  border-left-color: var(--border-strong);
  opacity: 0.6;
}
.bn {
  font-size: 15px;
  font-weight: 700;
}
.bp {
  font-size: 12.5px;
  font-weight: 600;
  margin-top: 2px;
}
.bd {
  font-size: 11px;
  color: var(--text-mute);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.editor-hd {
  padding: 15px 20px;
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
.order-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 11px;
  margin-bottom: 8px;
  font-size: 12.5px;
}
.ot {
  flex: 1;
  min-width: 0;
}
.ot b {
  display: block;
  font-size: 13px;
}
.ot small {
  color: var(--text-mute);
}
.stop {
  color: var(--red);
}
.editor-ft {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 13px 20px;
  border-top: 1px solid var(--border);
}
</style>
