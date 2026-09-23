import type { MedicalRecord, Patient } from '@/api/types'

/** 年龄计算 */
function ageOf(birthDate?: string): string {
  if (!birthDate) return ''
  const age = Math.floor((Date.now() - new Date(birthDate).getTime()) / (365 * 86400000))
  return age > 0 ? `${age} 岁` : ''
}

function fmtDateTime(d?: string): string {
  if (!d) return ''
  const date = new Date(d)
  const p = (n: number): string => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`
}

/** 中文日期：2026年08月31日 */
function fmtCnDate(d?: string): string {
  if (!d) return ''
  const date = new Date(d)
  return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`
}

function esc(s: string | undefined): string {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** 处方条目渲染成 Rp 行 */
function rxLines(record: MedicalRecord): string[] {
  const items = record.prescriptionItems ?? []
  if (items.length > 0) {
    return items.map((it, i) => {
      const parts = [it.drug, it.spec, it.dose, it.route, it.frequency, it.duration ? `× ${it.duration}` : ''].filter(Boolean).join(' ')
      return `Rp ${i + 1}：${parts}`
    })
  }
  const summary = record.prescriptionSummary ?? ''
  if (!summary.trim()) return []
  return summary
    .split(/[；;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s, i) => `Rp ${i + 1}：${s}`)
}

/** 费别：按医保类型勾选（市职工/城乡居民/新农合/商业 → 医保；其余 → 自费） */
function feeType(patient?: Patient | null): string {
  const t = patient?.insuranceType ?? ''
  if (!t || t === '自费') return '自费'
  if (t === '市职工医保' || t === '城乡居民医保' || t === '新农合' || t === '商业保险') return '医保'
  return '其他'
}

function checkBox(label: string, checked: boolean): string {
  return `<span class="cb">${checked ? '☑' : '□'}${label}</span>`
}

/** 处方笺（医院版式：费别/处方编号/姓名/病历号/诊断/住址电话/签名栏/费用栏） */
function rxHtml(record: MedicalRecord, patient: Patient | null | undefined, doctorDept?: string): string {
  const fee = feeType(patient)
  const gender = patient?.gender ?? ''
  const age = patient ? ageOf(patient.birthDate) : ''
  const lines = rxLines(record)
  const dx = record.diagnosis.map((d) => (d.code ? `${d.code} ${d.name}` : d.name)).join('；')
  return `
    <div class="rx-head">
      <span class="rx-valid">处方仅当天有效</span>
      <div class="rx-row">
        <span>费别：${checkBox('公费', fee === '公费')}${checkBox('自费', fee === '自费')}${checkBox('医保', fee === '医保')}${checkBox('其他', fee === '其他')}</span>
      </div>
      <div class="rx-row">
        <span>姓名：${esc(record.patientName)}</span>
        <span>性别：${checkBox('男', gender === '男')}${checkBox('女', gender === '女')}</span>
        <span>年龄：${esc(age || '—')}</span>
        <span class="pull">处方编号：${esc(record.recordNo)}</span>
      </div>
      <div class="rx-row">
        <span>门诊/住院病历号：${esc(patient?.medicalRecordNo ?? '')}</span>
        <span>科别（病区/床位号）：${esc(doctorDept || record.department)}</span>
      </div>
      <div class="rx-row">
        <span>临床诊断：${esc(dx || '—')}</span>
        <span>开具日期：${fmtCnDate(record.visitedAt)}</span>
      </div>
      <div class="rx-row">
        <span>住址电话：${esc(patient?.address ?? '')} ${esc(patient?.phone ?? '')}</span>
      </div>
    </div>
    <div class="rx-body">
      ${lines.length > 0 ? lines.map((l) => `<div class="rx-line">${esc(l)}</div>`).join('\n      ') : '<div class="rx-line rx-empty">（无处方明细）</div>'}
    </div>
    <div class="rx-sign-rows">
      <div class="rx-row">医师：${esc(record.doctorName)}<span class="sig">医师手签：</span><span class="sig">审核药师：</span></div>
      <div class="rx-row">工号：${esc(record.doctorUsername ?? '')}<span class="sig">调配药师/士：</span><span class="sig">核对、发药药师：</span></div>
    </div>
    <div class="rx-fee">
      <span>西药费：</span><span>中成药费：</span><span>中草药费：</span><span>药品费用合计：</span><span>收费员：</span>
    </div>`
}

/** 病历/检查申请版式（门诊病历、入院记录、检查申请单） */
function recordSections(record: MedicalRecord, isExam: boolean): string[] {
  const sections: string[] = []
  if (!isExam) {
    if (record.chiefComplaint) sections.push(`<div class="sec"><div class="sec-h">主诉</div><div class="sec-b">${esc(record.chiefComplaint)}</div></div>`)
    if (record.presentIllness) sections.push(`<div class="sec"><div class="sec-h">现病史</div><div class="sec-b">${esc(record.presentIllness)}</div></div>`)
    if (record.pastHistory) sections.push(`<div class="sec"><div class="sec-h">既往史</div><div class="sec-b">${esc(record.pastHistory)}</div></div>`)
    if (record.physicalExam || record.vitals) {
      const v = record.vitals
      const vitalParts: string[] = []
      if (v) {
        if (v.bpHigh || v.bpLow) vitalParts.push(`血压 ${v.bpHigh || '—'}/${v.bpLow || '—'}mmHg`)
        if (v.breath) vitalParts.push(`呼吸 ${v.breath}次/分`)
        if (v.temp) vitalParts.push(`体温 ${v.temp}℃`)
        if (v.pulse) vitalParts.push(`脉搏 ${v.pulse}次/分`)
      }
      const peText = [vitalParts.join('；'), record.physicalExam].filter(Boolean).join('\n')
      if (peText) sections.push(`<div class="sec"><div class="sec-h">体格检查</div><div class="sec-b">${esc(peText)}</div></div>`)
    }
  }
  if (record.diagnosis.length > 0) {
    const dx = record.diagnosis.map((d) => (d.code ? `${d.code} ${d.name}` : d.name)).join('；')
    sections.push(`<div class="sec"><div class="sec-h">临床诊断</div><div class="sec-b strong">${esc(dx)}</div></div>`)
  }
  if (!isExam && record.prescriptionSummary) {
    sections.push(`<div class="sec"><div class="sec-h">处方摘要</div><div class="sec-b">${esc(record.prescriptionSummary)}</div></div>`)
  }
  if (isExam) {
    sections.push(`<div class="sec"><div class="sec-h">检查项目</div><div class="sec-b strong">${esc(record.examRequest?.trim() || '（未填写检查项目）')}</div></div>`)
  }
  return sections
}

/**
 * 打印纸张：@page 尺寸与整页缩放（内容按 A4 版式设计，小纸张整体等比缩放以适配整张纸）
 * zoom 基准：A4 可打印宽度 210-2×18=174mm；A5 148-2×10=128mm → 128/174≈0.736；
 * B5 176-2×12=152mm → 152/174≈0.874
 */
export type PrintPageSize = 'A4' | 'A5' | 'B5' | 'Letter' | 'Legal'
/** 方向：auto 按文档版式（默认纵向）、portrait 纵向、landscape 横向 */
export type PrintOrientation = 'auto' | 'portrait' | 'landscape'
/** 缩放：page=适配整张纸（默认，随纸张自动缩放）、actual=实际大小 1:1、数字=自定义百分比 */
export type PrintFit = 'page' | 'actual' | number

export interface PrintBuildOptions {
  pageSize?: PrintPageSize
  orientation?: PrintOrientation
  fit?: PrintFit
}

/** 纸张物理尺寸（mm，纵向） */
export const PRINT_PAPER_MM: Record<PrintPageSize, { w: number; h: number }> = {
  A4: { w: 210, h: 297 },
  A5: { w: 148, h: 210 },
  B5: { w: 176, h: 250 },
  Letter: { w: 216, h: 279 },
  Legal: { w: 216, h: 356 }
}

/** CSS 预定义纸张名 */
const CSS_PAGE_NAME: Record<PrintPageSize, string> = {
  A4: 'A4',
  A5: 'A5',
  B5: 'B5',
  Letter: 'letter',
  Legal: 'legal'
}

/** 各纸张页边距（mm，纵向基准） */
const PAGE_MARGIN: Record<PrintPageSize, { v: number; h: number }> = {
  A4: { v: 20, h: 18 },
  A5: { v: 10, h: 10 },
  B5: { v: 12, h: 12 },
  Letter: { v: 20, h: 16 },
  Legal: { v: 20, h: 16 }
}

/** 纸张页边距（mm，v=上下 h=左右），预览估算可打印区域用 */
export function pageMarginOf(pageSize: PrintPageSize): { v: number; h: number } {
  return PAGE_MARGIN[pageSize] ?? PAGE_MARGIN.A4
}

/** CSS 毫米 → 像素（96dpi） */
export const PRINT_MM_TO_PX = 96 / 25.4

const MM_TO_PX = PRINT_MM_TO_PX

/** A4 版式基准可打印宽度（210-2×18=174mm），内容整体缩放以此为 1 */
const BASE_PRINTABLE_W = 174

/** 纸张 CSS 像素尺寸（96dpi，按方向换算，预览排版用） */
export function paperPxOf(pageSize: PrintPageSize, landscape = false): { w: number; h: number } {
  const mm = PRINT_PAPER_MM[pageSize] ?? PRINT_PAPER_MM.A4
  const rawW = (landscape ? mm.h : mm.w) * MM_TO_PX
  const rawH = (landscape ? mm.w : mm.h) * MM_TO_PX
  return { w: Math.round(rawW), h: Math.round(rawH) }
}

/** 适配整张纸的缩放：纸张可打印宽 / A4 基准可打印宽（A5≈0.736、B5≈0.874） */
export function fitZoomOf(pageSize: PrintPageSize, landscape = false): number {
  const mm = PRINT_PAPER_MM[pageSize] ?? PRINT_PAPER_MM.A4
  const m = PAGE_MARGIN[pageSize] ?? PAGE_MARGIN.A4
  const printableW = (landscape ? mm.h : mm.w) - m.h * 2
  return Math.round((printableW / BASE_PRINTABLE_W) * 1000) / 1000
}

/** 由缩放模式解析出实际 zoom 值 */
function resolveZoom(pageSize: PrintPageSize, landscape: boolean, fit: PrintFit): number {
  if (fit === 'actual') return 1
  if (typeof fit === 'number' && fit > 0) return Math.round((fit / 100) * 1000) / 1000
  return fitZoomOf(pageSize, landscape)
}

/**
 * 打印文档生成：按业务分流版式
 * - prescription：处方笺（医院模板：费别/处方编号/姓名/病历号/临床诊断/开具日期/住址电话/Rp/签名栏/费用栏）
 * - outpatient/admission：病历
 * - exam：检查申请单
 * options 决定 @page 纸张/方向与整页缩放，保证内容适配整张纸（预览与打印共用同一份文档）
 */
export function buildRecordPrintHtml(
  record: MedicalRecord,
  patient?: Patient | null,
  doctorDepartment?: string,
  options: PrintBuildOptions | PrintPageSize = {}
): string {
  const opts: PrintBuildOptions = typeof options === 'string' ? { pageSize: options } : options
  const pageSize: PrintPageSize = opts.pageSize ?? 'A4'
  const landscape = (opts.orientation ?? 'auto') === 'landscape'
  const margin = PAGE_MARGIN[pageSize] ?? PAGE_MARGIN.A4
  const pageCss = `${CSS_PAGE_NAME[pageSize] ?? 'A4'}${landscape ? ' landscape' : ''}`
  const zoom = resolveZoom(pageSize, landscape, opts.fit ?? 'page')
  const type = record.type
  const isRx = type === 'prescription'
  const isExam = type === 'exam'
  const title = isRx ? '处方笺' : isExam ? '检查申请单' : type === 'admission' ? '入院记录' : '门诊病历'
  const patientName = record.patientName || patient?.name || ''

  const body = isRx
    ? rxHtml(record, patient, doctorDepartment)
    : `
    <div class="meta">
      <span>姓名：${esc(patientName)}</span>
      <span>性别：${esc(patient?.gender ?? '') || '—'}</span>
      <span>年龄：${patient ? ageOf(patient.birthDate) : '—'}</span>
      <span>档案号：${esc(patient?.medicalRecordNo ?? record.recordNo)}</span>
      <span>科别：${esc(record.department)}</span>
      <span>就诊时间：${fmtDateTime(record.visitedAt)}</span>
    </div>
    ${recordSections(record, isExam).join('\n    ')}
    <div class="sign">
      <div>医师签名：${esc(record.signedBy ?? record.doctorName)}</div>
      <div>日期：${record.signedAt ? fmtDateTime(record.signedAt).slice(0, 10) : ''}</div>
    </div>`

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<style>
  @page { size: ${pageCss}; margin: ${margin.v}mm ${margin.h}mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'SimSun', '宋体', serif; font-size: 12pt; color: #000; line-height: 1.8; }
  .doc { max-width: 160mm; margin: 0 auto; zoom: ${zoom}; }
  .head { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 6px; }
  .head h1 { font-size: 16pt; letter-spacing: 4px; }
  .meta { display: flex; flex-wrap: wrap; gap: 4px 24px; font-size: 11pt; margin: 10px 0 6px; padding: 6px 0; border-bottom: 1px dashed #999; }
  .sec { margin: 10px 0; }
  .sec-h { font-weight: bold; font-size: 11pt; }
  .sec-b { margin-top: 2px; text-indent: 2em; white-space: pre-wrap; }
  .sec-b.strong { font-weight: bold; }
  .sign { display: flex; justify-content: space-between; margin-top: 42px; font-size: 11pt; }
  .sign div { width: 45%; border-top: 1px solid #000; padding-top: 6px; text-align: center; }
  .foot { margin-top: 14px; font-size: 9pt; color: #666; text-align: center; }
  .no-print { display: none; }

  /* ===== 处方笺（医院模板） ===== */
  .rx-head { border: 1px solid #000; border-bottom: none; padding: 8px 12px; position: relative; }
  .rx-valid {
    position: absolute;
    top: 8px;
    right: 12px;
    border: 1.5px solid #c8102e;
    color: #c8102e;
    font-size: 9pt;
    font-weight: bold;
    line-height: 1.5;
    padding: 0 6px;
    letter-spacing: 2px;
  }
  .rx-row { display: flex; flex-wrap: wrap; gap: 2px 28px; font-size: 11.5pt; margin: 3px 0; }
  .rx-row .pull { margin-left: auto; }
  .cb { margin-right: 10px; }
  .sig { margin-left: 26px; }
  .rx-body { border: 1px solid #000; border-bottom: none; min-height: 140px; padding: 10px 12px; }
  .rx-line { font-size: 11.5pt; margin: 4px 0; }
  .rx-empty { color: #888; }
  .rx-sign-rows { border: 1px solid #000; border-bottom: none; padding: 8px 12px; font-size: 11.5pt; }
  .rx-fee { display: flex; justify-content: space-between; border: 1px solid #000; padding: 8px 12px; font-size: 11.5pt; }
</style>
</head>
<body>
  <div class="doc">
    <div class="head">
      <h1>${title}</h1>
    </div>
    ${body}
    <div class="foot">打印时间 ${fmtDateTime(new Date().toISOString())}</div>
  </div>
</body>
</html>`
}
