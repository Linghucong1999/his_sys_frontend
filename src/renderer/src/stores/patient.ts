import { defineStore } from 'pinia'
import { createPatient, searchPatients } from '@/api/patients'
import { createVisit, listVisitsByPatient } from '@/api/misc'
import type { Patient, Visit } from '@/api/types'

interface PatientState {
  current: Patient | null
  visits: Visit[]
  searchResults: Patient[]
  /** 进入接诊后自动定位的目标 tab（续写未完成项用） */
  targetTab: string
}

export const TAB_OF_PENDING: Record<string, string> = {
  未写病历: 'record',
  未写处方: 'prescription',
  未写检查: 'exam'
}

export const usePatientStore = defineStore('patient', {
  state: (): PatientState => ({
    current: null,
    visits: [],
    searchResults: [],
    targetTab: ''
  }),
  actions: {
    /** 新建首诊：建档（EMPI 入口）→ 创建就诊 → 进入接诊 */
    async firstVisit(input: {
      name: string
      gender?: string
      age?: number
      phone?: string
      address?: string
      insuranceType?: string
      chiefComplaint?: string
    }): Promise<Patient> {
      const patient = await createPatient({
        name: input.name,
        gender: input.gender,
        phone: input.phone,
        address: input.address,
        insuranceType: input.insuranceType
      })
      await createVisit({
        patientId: patient._id,
        empiId: patient.empiId,
        patientName: patient.name,
        type: 'first',
        chiefComplaint: input.chiefComplaint
      })
      this.current = patient
      this.visits = await listVisitsByPatient(patient._id)
      return patient
    },

    /** 复诊调档：检索 → 创建复诊就诊 → 进入接诊 */
    async search(keyword: string): Promise<Patient[]> {
      this.searchResults = await searchPatients(keyword)
      return this.searchResults
    },

    async followup(patient: Patient): Promise<void> {
      await createVisit({
        patientId: patient._id,
        empiId: patient.empiId,
        patientName: patient.name,
        type: 'followup'
      })
      this.current = patient
      this.targetTab = ''
      this.visits = await listVisitsByPatient(patient._id)
    },

    /** 续写：接诊未完成的患者不新建就诊，直接进入接诊并定位到缺失 tab */
    async resume(patient: Patient, tab: string): Promise<void> {
      this.current = patient
      this.targetTab = tab
      this.visits = await listVisitsByPatient(patient._id)
    },

    /** 进入接诊后消费目标 tab */
    consumeTargetTab(): string {
      const t = this.targetTab
      this.targetTab = ''
      return t
    },

    async load(patientId: string): Promise<void> {
      this.current = null
      this.visits = []
      const { fetchPatient } = await import('@/api/patients')
      this.current = await fetchPatient(patientId)
      this.visits = await listVisitsByPatient(patientId)
    },

    /** 切换账号时清空接诊上下文（防止看到其他医生的接诊状态） */
    reset(): void {
      this.current = null
      this.visits = []
      this.searchResults = []
      this.targetTab = ''
    }
  }
})
