<template>
  <div class="qs-grid">
    <!-- 左：新建首诊 -->
    <div>
      <div class="qs-title">🆕 新建首诊</div>
      <div class="qs-desc">首次就诊患者，医师直接创建档案与首诊病历</div>
      <div class="qs-form">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px">
          <input v-model="firstForm.name" class="inp" placeholder="患者姓名" />
          <input v-model="firstForm.phone" class="inp" placeholder="手机号" />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px">
          <HisSelect
            v-model="firstForm.gender"
            :options="GENDER_OPTIONS"
            placeholder="性别"
          />
          <input v-model="firstForm.age" class="inp" placeholder="年龄" />
        </div>
        <HisSelect
          v-model="firstForm.insuranceType"
          :options="INSURANCE_OPTIONS"
          placeholder="医保类型（市职工 / 城乡居民 / 新农合 / 商业保险 / 自费）"
        />
        <input v-model="firstForm.address" class="inp" placeholder="住址（常住地址）" />
        <textarea v-model="firstForm.chiefComplaint" class="inp" placeholder="主诉（一句话）"></textarea>
        <button class="btn btn-primary" :disabled="loading" @click="onFirstVisit">创建档案并接诊 →</button>
      </div>
    </div>
    <!-- 右：复诊调档 -->
    <div style="border-left: 1px dashed var(--border-strong); padding-left: 20px">
      <div class="qs-title">🔁 复诊调档</div>
      <div class="qs-desc">已就诊过的患者，姓名 + 手机号调档，直接续方</div>
      <div class="search-row">
        <input
          v-model="searchKw"
          class="inp search-inp"
          placeholder="🔍 姓名 + 手机号，如：张丽华 138****2671"
          @keydown.enter="onSearch"
        />
        <button class="btn btn-ghost search-btn" :disabled="searchLoading" @click="onSearch">搜索</button>
      </div>
      <div v-for="p in patientStore.searchResults.slice(0, 2)" :key="p._id" class="qs-result">
        <div class="ava">{{ p.name[0] }}</div>
        <div style="flex: 1; min-width: 0">
          <b style="font-size: 13.5px">{{ p.name }}</b>
          <span style="color: var(--text-mute); font-size: 11.5px">
            {{ p.gender ?? '未知' }} · {{ p.phone ?? '' }}
          </span>
          <div style="font-size: 11.5px; color: var(--text-mute); margin-top: 2px">
            档案号 {{ p.medicalRecordNo ?? p.empiId }}
          </div>
        </div>
        <template v-if="p.pending && p.pending.length > 0">
          <button
            v-for="(item, i) in p.pending"
            :key="i"
            class="btn btn-sm"
            :class="i === 0 ? 'btn-primary' : 'btn-ghost'"
            @click="onResume(p)"
          >
            {{ item }}
          </button>
        </template>
        <button v-else class="btn btn-primary btn-sm" @click="onFollowup(p)">调档接诊</button>
      </div>
      <div v-if="patientStore.searchResults.length === 0" style="font-size: 11.5px; color: var(--text-mute)">
        💡 调档后自动带入上次诊断与历史处方，一键复制续方
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { usePatientStore, TAB_OF_PENDING } from '@/stores/patient'
import HisSelect from '@/components/HisSelect.vue'
import { ElMessageBox } from 'element-plus'
import 'element-plus/es/components/message-box/style/css'
import type { Patient } from '@/api/types'

/** 统一错误弹窗 */
function alertError(msg: string, title = '操作失败'): void {
  void ElMessageBox.alert(msg, title, { confirmButtonText: '知道了', type: 'error' })
}

const GENDER_OPTIONS = [
  { value: '女', label: '女' },
  { value: '男', label: '男' }
]

const INSURANCE_OPTIONS = [
  { value: '市职工医保', label: '市职工医保' },
  { value: '城乡居民医保', label: '城乡居民医保' },
  { value: '新农合', label: '新农合' },
  { value: '商业保险', label: '商业保险' },
  { value: '自费', label: '自费' }
]

const router = useRouter()
const patientStore = usePatientStore()
const loading = ref(false)

const firstForm = reactive({
  name: '',
  phone: '',
  gender: '',
  insuranceType: '',
  age: '',
  address: '',
  chiefComplaint: ''
})

const searchKw = ref('')
const searchLoading = ref(false)

async function onFirstVisit(): Promise<void> {
  if (!firstForm.name.trim()) {
    alertError('请输入患者姓名')
    return
  }
  loading.value = true
  try {
    await patientStore.firstVisit({
      name: firstForm.name.trim(),
      phone: firstForm.phone.trim() || undefined,
      gender: firstForm.gender || undefined,
      insuranceType: firstForm.insuranceType || undefined,
      age: firstForm.age ? Number(firstForm.age) : undefined,
      address: firstForm.address.trim() || undefined,
      chiefComplaint: firstForm.chiefComplaint.trim() || undefined
    })
    router.push('/p360')
  } catch (e) {
    alertError((e as Error).message)
  } finally {
    loading.value = false
  }
}

async function onSearch(): Promise<void> {
  if (!searchKw.value.trim()) return
  searchLoading.value = true
  try {
    await patientStore.search(searchKw.value.trim())
  } catch (e) {
    alertError((e as Error).message)
  } finally {
    searchLoading.value = false
  }
}

async function onFollowup(p: Patient): Promise<void> {
  loading.value = true
  try {
    await patientStore.followup(p)
    router.push('/p360')
  } catch (e) {
    alertError((e as Error).message)
  } finally {
    loading.value = false
  }
}

/** 续写：接诊未完成，进入接诊并定位到缺失 tab */
async function onResume(p: Patient): Promise<void> {
  const pendingTab = p.pending?.length ? (TAB_OF_PENDING[p.pending[0]] ?? 'record') : 'record'
  await patientStore.resume(p, pendingTab)
  router.push('/p360')
}

// 预置复诊调档列表（对齐 UI 稿：显示已有患者档案）
void patientStore.search('')

// 输入即搜：姓名/手机号/姓名+手机号，防抖 300ms 实时显示结果
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(searchKw, (v) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    void patientStore.search(v.trim()).catch(() => undefined)
  }, 300)
})

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
})
</script>

<style scoped>
.qs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.qs-title {
  font-size: 14px;
  font-weight: 700;
}
.qs-desc {
  font-size: 12px;
  color: var(--text-mute);
  margin: 3px 0 12px;
}
.qs-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.qs-result {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 11px;
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 8px;
  transition: 0.15s;
  cursor: pointer;
}
.qs-result:hover {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}
.search-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.search-inp {
  flex: 1;
  min-width: 0;
}
.search-btn {
  flex-shrink: 0;
  white-space: nowrap;
  cursor: pointer !important;
}
.ava {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--grad);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
}
</style>
