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

/** 病历打印文档（A4 正式版式：医院抬头、区块内容、医师签名栏） */
export function buildRecordPrintHtml(record: MedicalRecord, patient?: Patient | null): string {
  const isPrescription = record.type === 'prescription'
  const title = isPrescription ? '处方笺' : record.type === 'admission' ? '入院记录' : '门诊病历'
  const patientName = record.patientName || patient?.name || ''
  const gender = patient?.gender ?? ''
  const age = patient ? ageOf(patient.birthDate) : ''
  const recordNo = patient?.medicalRecordNo ?? record.recordNo

  const sections: string[] = []
  if (!isPrescription) {
    if (record.chiefComplaint) sections.push(`<div class="sec"><div class="sec-h">主诉</div><div class="sec-b">${esc(record.chiefComplaint)}</div></div>`)
    if (record.presentIllness) sections.push(`<div class="sec"><div class="sec-h">现病史</div><div class="sec-b">${esc(record.presentIllness)}</div></div>`)
    if (record.pastHistory) sections.push(`<div class="sec"><div class="sec-h">既往史</div><div class="sec-b">${esc(record.pastHistory)}</div></div>`)
    if (record.physicalExam) sections.push(`<div class="sec"><div class="sec-h">体格检查</div><div class="sec-b">${esc(record.physicalExam)}</div></div>`)
  }
  if (record.diagnosis.length > 0) {
    const dx = record.diagnosis.map((d) => (d.code ? `${d.code} ${d.name}` : d.name)).join('；')
    sections.push(`<div class="sec"><div class="sec-h">${isPrescription ? '临床诊断' : '诊断'}</div><div class="sec-b strong">${esc(dx)}</div></div>`)
  }
  if (record.prescriptionSummary) {
    sections.push(`<div class="sec"><div class="sec-h">处方</div><div class="sec-b">${esc(record.prescriptionSummary)}</div></div>`)
  }

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<style>
  @page { margin: 20mm 18mm; }
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
