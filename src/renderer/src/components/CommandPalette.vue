<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { globalSearch } from '@/api/misc'
import { usePatientStore } from '@/stores/patient'
import type { SearchResultItem } from '@/api/types'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const router = useRouter()
const patientStore = usePatientStore()
const query = ref('')
const results = ref<SearchResultItem[]>([])
const selected = ref(0)
const inputRef = ref<HTMLInputElement>()

const ICONS: Record<string, string> = {
  patient: '👤',
  record: '📋',
  drug: '💊',
  command: '⚡'
}

async function search(): Promise<void> {
  results.value = await globalSearch(query.value)
  selected.value = 0
}

async function open(): Promise<void> {
  emit('update:modelValue', true)
  await nextTick()
  await search()
  inputRef.value?.focus()
}

function close(): void {
  emit('update:modelValue', false)
  query.value = ''
  results.value = []
}

async function execute(item: SearchResultItem): Promise<void> {
  close()
  if (item.kind === 'patient' && item.patientId) {
    await patientStore.load(item.patientId)
    router.push('/p360')
  } else if (item.kind === 'record' && item.patientId) {
    await patientStore.load(item.patientId)
    router.push('/emr')
  } else if (item.kind === 'command') {
    if (item.title.includes('会诊')) router.push('/consultations')
    else if (item.title.includes('签名')) router.push('/emr')
    else router.push('/workbench')
  } else if (item.kind === 'drug') {
    router.push('/p360')
  }
}

function onKeydown(e: KeyboardEvent): void {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    void open()
  }
  if (e.key === 'Escape' && props.modelValue) close()
}

watch(query, () => {
  void search()
})

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div v-if="modelValue" class="cmdk-mask open" @click.self="close">
    <div class="cmdk-panel">
      <div class="cmdk-input">
        🔍
        <input
          ref="inputRef"
          v-model="query"
          placeholder="姓名 + 手机号搜索患者，或输入命令…"
          @keydown.down.prevent="selected = Math.min(selected + 1, results.length - 1)"
          @keydown.up.prevent="selected = Math.max(selected - 1, 0)"
          @keydown.enter.prevent="results[selected] && execute(results[selected])"
        />
      </div>
      <div class="cmdk-list">
        <div
          v-for="(item, i) in results"
          :key="i"
          class="cmdk-item"
          :class="{ sel: i === selected }"
          @click="execute(item)"
          @mouseenter="selected = i"
        >
          <div class="ci">{{ ICONS[item.kind] ?? '🔍' }}</div>
          <div style="min-width: 0">
            <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{{ item.title }}</div>
          </div>
          <small>{{ item.sub }}</small>
        </div>
      </div>
      <div class="cmdk-ft">
        <span>↑↓ 选择</span><span>↵ 执行</span><span>esc 关闭</span>
        <span style="margin-left: auto">HIS 医疗信息管理系统</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cmdk-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 20, 32, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 16vh;
  z-index: 60;
}
.cmdk-mask.open {
  animation: fadeUp 0.2s ease;
}
.cmdk-panel {
  width: 560px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}
.cmdk-input {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border);
  font-size: 15px;
}
.cmdk-input input {
  flex: 1;
  border: none;
  outline: none;
  background: none;
  font-size: 15px;
  color: var(--text);
  font-family: var(--font);
}
.cmdk-list {
  padding: 8px;
  max-height: 320px;
  overflow-y: auto;
}
.cmdk-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 12px;
  border-radius: 11px;
  cursor: pointer;
  font-size: 13.5px;
}
.cmdk-item:hover,
.cmdk-item.sel {
  background: var(--primary-soft);
}
.cmdk-item .ci {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: var(--card2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}
.cmdk-item small {
  margin-left: auto;
  color: var(--text-mute);
  font-size: 11.5px;
  flex-shrink: 0;
}
.cmdk-ft {
  padding: 9px 16px;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 14px;
  font-size: 11px;
  color: var(--text-mute);
}
</style>
