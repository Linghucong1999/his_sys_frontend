<template>
  <div class="tl-card">
    <div class="tl-hd">
      <span class="tl-title">🕘 既往病历时间轴</span>
      <span class="tl-sub">
        共 {{ records.length }} 份 · 由不同医师书写的历史文书（只读，点击查看）
      </span>
    </div>
    <div class="tl-body">
      <div
        v-for="(r, i) in records"
        :key="r._id"
        class="tl-item"
        :class="{ other: isOther(r) }"
        @click="emit('select', r)"
      >
        <div class="tl-rail">
          <span class="tl-dot" :class="r.signed ? 'signed' : 'draft'"></span>
          <span v-if="i < records.length - 1" class="tl-line"></span>
        </div>
        <div class="tl-content">
          <div class="tl-row">
            <span class="tl-time">{{ fmtTime(r.visitedAt) }}</span>
            <span class="tl-type">{{ typeLabel(r.type) }}</span>
            <span class="tag" :class="r.signed ? 'tag-green' : 'tag-orange'">
              {{ r.signed ? (r.signedBy ?? '已签名') : '草稿' }}
            </span>
            <span v-if="isOther(r)" class="tag tag-blue">其他医师</span>
          </div>
          <div class="tl-detail">
            {{ r.doctorName }}<template v-if="r.department"> · {{ r.department }}</template>
            <template v-if="briefOf(r)"> · {{ briefOf(r) }}</template>
          </div>
        </div>
      </div>
      <div v-if="records.length === 0" class="tl-empty">暂无历史病历</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MedicalRecord } from '@/api/types'

const props = defineProps<{
  records: MedicalRecord[]
  /** 当前登录用户 ID：用于标记「其他医师」书写的记录 */
  currentUserId?: string
}>()
const emit = defineEmits<{ (e: 'select', record: MedicalRecord): void }>()

const TYPE_LABEL: Record<string, string> = {
  outpatient: '门诊病历',
  prescription: '处方笺',
  admission: '入院记录',
  exam: '检查申请'
}

function typeLabel(type: string): string {
  return TYPE_LABEL[type] ?? type
}

function fmtTime(v?: string): string {
  if (!v) return '—'
  const d = new Date(v)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function isOther(r: MedicalRecord & { doctorId?: string }): boolean {
  return Boolean(props.currentUserId && r.doctorId && r.doctorId !== props.currentUserId)
}

function briefOf(r: MedicalRecord): string {
  if (r.diagnosis?.length) return r.diagnosis.map((d) => d.name).join('；')
  const first = (r.prescriptionSummary ?? '').trim().split('\n')[0]
  if (first) return first.length > 28 ? first.slice(0, 28) + '…' : first
  if (r.chiefComplaint) return r.chiefComplaint.slice(0, 28)
  return ''
}
</script>

<style scoped>
.tl-card {
  margin-top: 12px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 14px 16px;
}
.tl-hd {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
}
.tl-title {
  font-size: 13px;
  font-weight: 600;
}
.tl-sub {
  font-size: 11.5px;
  color: var(--text-mute);
}
.tl-body {
  max-height: 260px;
  overflow-y: auto;
}
.tl-item {
  display: grid;
  grid-template-columns: 18px 1fr;
  gap: 8px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 8px;
  transition: 0.15s;
}
.tl-item:hover {
  background: var(--card2);
}
.tl-rail {
  position: relative;
  display: flex;
  justify-content: center;
}
.tl-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-top: 6px;
  background: var(--border-strong);
}
.tl-dot.signed {
  background: var(--green);
}
.tl-dot.draft {
  background: var(--orange);
}
.tl-line {
  position: absolute;
  top: 17px;
  bottom: -6px;
  width: 1px;
  background: var(--border);
}
.tl-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.tl-time {
  font-size: 11.5px;
  color: var(--text-sub);
  font-variant-numeric: tabular-nums;
}
.tl-type {
  font-size: 12.5px;
  font-weight: 600;
}
.tl-detail {
  font-size: 11.5px;
  color: var(--text-mute);
  margin-top: 1px;
}
.tl-item.other .tl-type::after {
  content: '';
}
.tl-empty {
  font-size: 12px;
  color: var(--text-mute);
  padding: 8px;
}
</style>
