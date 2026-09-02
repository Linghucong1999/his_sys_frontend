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

function esc(s: string | undefined): string {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** 处方条目渲染成 Rp 列表文本 */
function rxText(record: MedicalRecord): string {
  const items = record.prescriptionItems ?? []
  if (items.length > 0) {
    return items
      .map((it, i) => {
        const parts = [it.drug, it.spec, it.dose, it.route, it.frequency, it.duration ? `× ${it.duration}` : ''].filter(Boolean).join(' ')
        return `Rp ${i + 1}：${parts}`
      })
      .join('\n')
  }
  return record.prescriptionSummary ?? ''
}

/**
 * 打印文档生成：按业务分流三种版式
 * - outpatient/admission：病历（主诉/现病史/既往史/体格检查/诊断）
 * - prescription：处方笺（Rp 条目 + 临床诊断）
 * - exam：检查申请单（申请项目 + 临床诊断）
 */
export function buildRecordPrintHtml(record: MedicalRecord, patient?: Patient | null): string {
  const type = record.type
  const isRx = type === 'prescription'
  const isExam = type === 'exam'
  const title = isRx ? '处方笺' : isExam ? '检查申请单' : type === 'admission' ? '入院记录' : '门诊病历'
  const patientName = record.patientName || patient?.name || ''
  const gender = patient?.gender ?? ''
  const age = patient ? ageOf(patient.birthDate) : ''
  const recordNo = patient?.medicalRecordNo ?? record.recordNo

  const sections: string[] = []
  // 病历版式：病史区块
  if (!isRx && !isExam) {
    if (record.chiefComplaint) sections.push(`<div class="sec"><div class="sec-h">主诉</div><div class="sec-b">${esc(record.chiefComplaint)}</div></div>`)
    if (record.presentIllness) sections.push(`<div class="sec"><div class="sec-h">现病史</div><div class="sec-b">${esc(record.presentIllness)}</div></div>`)
    if (record.pastHistory) sections.push(`<div class="sec"><div class="sec-h">既往史</div><div class="sec-b">${esc(record.pastHistory)}</div></div>`)
    if (record.physicalExam) sections.push(`<div class="sec"><div class="sec-h">体格检查</div><div class="sec-b">${esc(record.physicalExam)}</div></div>`)
  }
  // 临床诊断：三种版式均显示
  if (record.diagnosis.length > 0) {
    const dx = record.diagnosis.map((d) => (d.code ? `${d.code} ${d.name}` : d.name)).join('；')
    sections.push(`<div class="sec"><div class="sec-h">临床诊断</div><div class="sec-b strong">${esc(dx)}</div></div>`)
  }
  // 处方版式：Rp 条目
  if (isRx) {
    sections.push(`<div class="sec"><div class="sec-h">Rp</div><div class="sec-b rx">${esc(rxText(record))}</div></div>`)
  }
  // 检查申请版式：检查项目
  if (isExam) {
    const exam = record.examRequest?.trim() || '（未填写检查项目）'
    sections.push(`<div class="sec"><div class="sec-h">检查项目</div><div class="sec-b strong">${esc(exam)}</div></div>`)
  }

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<style>
  @page { size: A4; margin: 20mm 18mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'SimSun', '宋体', serif; font-size: 12pt; color: #000; line-height: 1.8; }
  .doc { max-width: 160mm; margin: 0 auto; }
  .head { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 6px; }
  .head h1 { font-size: 18pt; letter-spacing: 2px; }
  .head .sub { font-size: 9pt; color: #444; margin-top: 2px; }
  .meta { display: flex; flex-wrap: wrap; gap: 4px 24px; font-size: 11pt; margin: 10px 0 6px; padding: 6px 0; border-bottom: 1px dashed #999; }
  .sec { margin: 10px 0; }
  .sec-h { font-weight: bold; font-size: 11pt; }
  .sec-b { margin-top: 2px; text-indent: 2em; white-space: pre-wrap; }
  .sec-b.strong { font-weight: bold; }
  .sec-b.rx { text-indent: 0; }
  .sign { display: flex; justify-content: space-between; margin-top: 42px; font-size: 11pt; }
  .sign div { width: 45%; border-top: 1px solid #000; padding-top: 6px; text-align: center; }
  .foot { margin-top: 14px; font-size: 9pt; color: #666; text-align: center; }
  .no-print { display: none; }
</style>
</head>
<body>
  <div class="doc">
    <div class="head">
      <h1>HIS 医疗信息管理系统</h1>
      <div class="sub">${title}</div>
    </div>
    <div class="meta">
      <span>姓名：${esc(patientName)}</span>
      <span>性别：${esc(gender) || '—'}</span>
      <span>年龄：${age || '—'}</span>
      <span>档案号：${esc(recordNo)}</span>
      <span>科别：${esc(record.department)}</span>
      <span>就诊时间：${fmtDateTime(record.visitedAt)}</span>
    </div>
    ${sections.join('\n    ')}
    <div class="sign">
      <div>医师签名：${esc(record.signedBy ?? '')}</div>
      <div>日期：${record.signedAt ? fmtDateTime(record.signedAt).slice(0, 10) : ''}</div>
    </div>
    <div class="foot">本单据由 HIS 医疗信息管理系统生成 · 打印时间 ${fmtDateTime(new Date().toISOString())}</div>
  </div>
</body>
</html>`
}
