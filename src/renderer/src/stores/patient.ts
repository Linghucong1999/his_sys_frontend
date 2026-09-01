import { defineStore } from 'pinia'
import { createPatient, searchPatients } from '@/api/patients'
import { createVisit, listVisitsByPatient } from '@/api/misc'
import type { Patient, Visit } from '@/api/types'

interface PatientState {
  current: Patient | null
  visits: Visit[]
  searchResults: Patient[]
}

export const usePatientStore = defineStore('patient', {
  state: (): PatientState => ({
    current: null,
    visits: [],
    searchResults: []
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
      this.visits = await listVisitsByPatient(patient._id)
    },

    async load(patientId: string): Promise<void> {
      this.current = null
      this.visits = []
      const { fetchPatient } = await import('@/api/patients')
      this.current = await fetchPatient(patientId)
      this.visits = await listVisitsByPatient(patientId)
    }
  }
})
