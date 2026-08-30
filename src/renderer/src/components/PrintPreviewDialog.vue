<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  visible: boolean
  title: string
  printHtml: string
}>()
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void; (e: 'printed'): void }>()

const copies = ref(1)
const printing = ref(false)
const errorMsg = ref('')

/** iframe 预览地址（data URL 渲染打印稿） */
const previewUrl = computed(() =>
  props.printHtml ? 'data:text/html;charset=utf-8,' + encodeURIComponent(props.printHtml) : ''
)

function close(): void {
  emit('update:visible', false)
  errorMsg.value = ''
}

async function doPrint(): Promise<void> {
  if (!props.printHtml) return
  printing.value = true
  errorMsg.value = ''
  try {
    const result = await window.api.printHtml(props.printHtml, { silent: true, copies: copies.value })
    if (!result.ok) {
      errorMsg.value = `打印失败${result.reason ? '：' + result.reason : ''}`
      return
    }
    emit('printed')
    close()
  } catch (e) {
    errorMsg.value = (e as Error).message
  } finally {
    printing.value = false
  }
}
</script>

<template>
  <div v-if="visible" class="preview-mask" @click.self="close">
    <div class="preview-panel">
      <div class="preview-hd">
        <span class="preview-title">🖨 打印预览 · {{ title }}</span>
        <button class="icon-btn" title="关闭" @click="close">✕</button>
      </div>
      <div class="preview-body">
        <!-- 左侧：打印稿预览（A4 等比缩放） -->
        <div class="preview-page">
          <iframe v-if="previewUrl" :src="previewUrl" class="preview-iframe" title="打印预览"></iframe>
        </div>
        <!-- 右侧：打印设置 -->
        <div class="preview-ops">
          <div class="ops-sec">
            <div class="ops-label">打印机</div>
            <div class="ops-value">系统默认打印机（静默打印）</div>
          </div>
          <div class="ops-sec">
            <div class="ops-label">份数</div>
            <div class="copies-row">
              <button class="btn btn-ghost btn-sm" @click="copies = Math.max(1, copies - 1)">−</button>
              <span class="copies-num">{{ copies }}</span>
              <button class="btn btn-ghost btn-sm" @click="copies = copies + 1">＋</button>
            </div>
          </div>
          <div class="ops-tip">打印稿与预览一致，包含医院抬头与医师签名栏。</div>
          <div v-if="errorMsg" class="err">{{ errorMsg }}</div>
        </div>
      </div>
      <div class="preview-ft">
        <button class="btn btn-ghost" @click="close">取消</button>
        <button class="btn btn-primary" :disabled="printing" @click="doPrint">
          {{ printing ? '打印中…' : `🖨 打印（${copies} 份）` }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 20, 32, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 90;
  cursor: pointer;
  animation: fadeUp 0.18s ease;
}
.preview-panel {
  width: 900px;
  max-width: 94vw;
  max-height: 92vh;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: default;
}
.preview-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
}
.preview-title {
  font-size: 14px;
  font-weight: 700;
}
.icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-sub);
  background: var(--card2);
  border: 1px solid var(--border);
  transition: 0.15s;
}
.icon-btn:hover {
  color: var(--red);
  border-color: var(--red);
}
.preview-body {
  display: grid;
  grid-template-columns: 1fr 240px;
  gap: 14px;
  padding: 16px 18px;
  min-height: 0;
  flex: 1;
  overflow: auto;
}
.preview-page {
  background: var(--card2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  align-items: stretch;
  min-height: 560px;
}
.preview-iframe {
  width: 100%;
  border: none;
  background: #fff;
  border-radius: 6px;
  box-shadow: var(--shadow);
  min-height: 540px;
}
.preview-ops {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ops-sec {
  background: var(--card2);
  border: 1px solid var(--border);
  border-radius: 11px;
  padding: 12px 13px;
}
.ops-label {
  font-size: 11.5px;
  color: var(--text-mute);
  margin-bottom: 6px;
}
.ops-value {
  font-size: 12.5px;
}
.copies-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.copies-num {
  font-size: 15px;
  font-weight: 700;
  min-width: 24px;
  text-align: center;
}
.ops-tip {
  font-size: 11.5px;
  color: var(--text-mute);
  line-height: 1.6;
}
.err {
  font-size: 12px;
  color: var(--red);
  background: var(--red-bg);
  padding: 8px 10px;
  border-radius: 9px;
}
.preview-ft {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 18px;
  border-top: 1px solid var(--border);
}
</style>
