<template>
  <div v-if="visible" class="preview-mask" @click.self="close">
    <div class="preview-panel">
      <div class="preview-hd">
        <span class="preview-title">🖨 打印预览 · {{ title }}</span>
        <button class="icon-btn" title="关闭" @click="close">✕</button>
      </div>
      <div class="preview-body">
        <!-- 左侧：实时预览（比例 / 纸张尺寸 / 页码翻页） -->
        <div class="preview-page">
          <div class="preview-bar">
            <span class="bar-item">比例 <b>{{ zoomPercent }}%</b></span>
            <span class="bar-item">纸张 <b>{{ paperSizeText }}</b></span>
            <span class="preview-nav">
              <button class="nav-btn" :disabled="currentPage <= 1" title="上一页" @click="gotoPage(currentPage - 1)">‹</button>
              <span class="nav-text">第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
              <button
                class="nav-btn"
                :disabled="currentPage >= totalPages"
                title="下一页"
                @click="gotoPage(currentPage + 1)"
              >
                ›
              </button>
            </span>
          </div>
          <div ref="viewportRef" class="preview-viewport" @scroll="onScroll">
            <div
              class="preview-canvas"
              :style="{ width: paperPx.w * scale + 'px', height: contentH * scale + 'px' }"
            >
              <div
                class="preview-scaler"
                :style="{ width: paperPx.w + 'px', height: contentH + 'px', transform: `scale(${scale})` }"
              >
                <iframe
                  ref="iframeRef"
                  :srcdoc="html"
                  class="preview-iframe"
                  title="打印预览"
                  @load="measure"
                ></iframe>
              </div>
            </div>
          </div>
          <div class="preview-hint">页码按纸张可打印高度估算，实际分页以打印引擎为准</div>
        </div>

        <!-- 右侧：打印设置 -->
        <div class="preview-ops">
          <div class="ops-sec">
            <div class="ops-label">打印机</div>
            <ElSelect v-model="selectedPrinter" class="his-ep-select" placeholder="未检测到打印机" clearable>
              <ElOption v-for="p in printerOptions" :key="p.value" :label="p.label" :value="p.value" />
            </ElSelect>
          </div>

          <div class="ops-sec">
            <div class="ops-label">纸张 / 份数</div>
            <div class="ops-row">
              <ElSelect v-model="pageSize" class="his-ep-select ops-grow" placeholder="纸张">
                <ElOption v-for="p in PAPER_OPTIONS" :key="p.value" :label="p.label" :value="p.value" />
              </ElSelect>
              <div class="copies-row">
                <button class="step-btn" @click="copies = Math.max(1, copies - 1)">−</button>
                <span class="copies-num">{{ copies }}</span>
                <button class="step-btn" @click="copies = Math.min(99, copies + 1)">＋</button>
              </div>
            </div>
          </div>

          <div class="ops-sec">
            <div class="ops-label">要打印的页面</div>
            <label class="radio-row" :class="{ on: rangeMode === 'all' }">
              <input v-model="rangeMode" type="radio" value="all" />
              <span>所有页面</span>
            </label>
            <label class="radio-row" :class="{ on: rangeMode === 'current' }">
              <input v-model="rangeMode" type="radio" value="current" />
              <span>当前页（第 {{ currentPage }} 页）</span>
            </label>
            <label class="radio-row" :class="{ on: rangeMode === 'custom' }">
              <input v-model="rangeMode" type="radio" value="custom" />
              <span>页面：</span>
              <input
                v-model="customRange"
                class="range-input"
                :disabled="rangeMode !== 'custom'"
                placeholder="如 1-2"
              />
            </label>
            <div v-if="rangeMode === 'custom'" class="ops-note" :class="{ err: !parsedRanges }">
              {{ parsedRanges ? `将打印：${rangeText}` : '页码格式无效，请填写如 1-2 或 1,3' }}
            </div>
          </div>

          <div class="ops-sec">
            <div class="ops-label">缩放</div>
            <label class="radio-row" :class="{ on: fitMode === 'page' }">
              <input v-model="fitMode" type="radio" value="page" />
              <span>适合页面（自适应整张纸）</span>
            </label>
            <label class="radio-row" :class="{ on: fitMode === 'actual' }">
              <input v-model="fitMode" type="radio" value="actual" />
              <span>实际大小（100%）</span>
            </label>
            <label class="radio-row" :class="{ on: fitMode === 'custom' }">
              <input v-model="fitMode" type="radio" value="custom" />
              <span>自定义比例</span>
              <input
                v-model.number="customPct"
                class="pct-input"
                type="number"
                min="10"
                max="400"
                :disabled="fitMode !== 'custom'"
              />
              <span class="pct-unit">%</span>
            </label>
          </div>

          <div class="ops-sec">
            <div class="ops-label">方向</div>
            <div class="chip-row">
              <div
                v-for="o in ORIENTATIONS"
                :key="o.value"
                class="role-chip"
                :class="{ sel: orientation === o.value }"
                @click="orientation = o.value"
              >
                {{ o.icon }} {{ o.label }}
              </div>
            </div>
            <label class="check-row">
              <input v-model="grayscale" type="checkbox" class="check-box" />
              <span>以灰度（黑白）打印</span>
            </label>
          </div>

          <div v-if="errorMsg" class="err">{{ errorMsg }}</div>
        </div>
      </div>
      <div class="preview-ft">
        <button class="btn btn-ghost" @click="close">取消</button>
        <button class="btn btn-ghost" :disabled="printing" title="调起 Windows 系统打印对话框" @click="openSystemPrint">
          系统打印设置…
        </button>
        <button class="btn btn-primary" :disabled="printing" @click="doPrint">
          {{ printing ? '打印中…' : `🖨 打印（${copies} 份）` }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useElementSize } from '@vueuse/core'
import { ElSelect, ElOption } from 'element-plus'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/option/style/css'
import {
  PRINT_PAPER_MM,
  PRINT_MM_TO_PX,
  fitZoomOf,
  pageMarginOf,
  paperPxOf,
  type PrintBuildOptions,
  type PrintFit,
  type PrintOrientation,
  type PrintPageSize
} from '@/utils/print'

const props = defineProps<{
  visible: boolean
  title: string
  printHtml: string
  /** 按纸张/方向/缩放重建打印稿（切换设置时预览实时更新；缺省则沿用 printHtml） */
  buildHtml?: (options: PrintBuildOptions) => string
}>()
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void; (e: 'printed'): void }>()

const copies = ref(1)
const printing = ref(false)
const errorMsg = ref('')

const printers = ref<Array<{ name: string; displayName: string; isDefault: boolean }>>([])
const selectedPrinter = ref('')

/** 打印设置 */
const pageSize = ref<PrintPageSize>('A4')
const orientation = ref<PrintOrientation>('auto')
const fitMode = ref<'page' | 'actual' | 'custom'>('page')
const customPct = ref(100)
const grayscale = ref(false)
const rangeMode = ref<'all' | 'current' | 'custom'>('all')
const customRange = ref('')

const PAPER_SIZES: PrintPageSize[] = ['A4', 'A5', 'B5', 'Letter', 'Legal']
const PAPER_OPTIONS = PAPER_SIZES.map((p) => {
  const mm = PRINT_PAPER_MM[p]
  return { value: p, label: `${p}（${mm.w}×${mm.h}mm）` }
})

const ORIENTATIONS: Array<{ value: PrintOrientation; icon: string; label: string }> = [
  { value: 'auto', icon: '🖨', label: '自动' },
  { value: 'portrait', icon: '▯', label: '纵向' },
  { value: 'landscape', icon: '▭', label: '横向' }
]

const landscape = computed(() => orientation.value === 'landscape')

/** 缩放模式 → 打印参数；比例% 与打印稿内的 zoom 同源，保证预览=打印 */
/** 自定义比例（10%~400%，非法输入回退 100） */
const customPctSafe = computed(() => Math.max(10, Math.min(400, Number(customPct.value) || 100)))
/** 缩放模式 → 打印参数；比例% 与打印稿内的 zoom 同源，保证预览=打印 */
const fitValue = computed<PrintFit>(() => (fitMode.value === 'custom' ? customPctSafe.value : fitMode.value))
const zoom = computed(() => {
  if (fitMode.value === 'actual') return 1
  if (fitMode.value === 'custom') return customPctSafe.value / 100
  return fitZoomOf(pageSize.value, landscape.value)
})
const zoomPercent = computed(() => Math.round(zoom.value * 100))

const paperPx = computed(() => paperPxOf(pageSize.value, landscape.value))
const paperSizeText = computed(() => {
  const mm = PRINT_PAPER_MM[pageSize.value]
  const w = landscape.value ? mm.h : mm.w
  const h = landscape.value ? mm.w : mm.h
  return `${w} × ${h} 毫米（${landscape.value ? '横向' : '纵向'}）`
})

/** 打印稿 HTML：设置变化时按新参数重建 */
const html = ref(props.printHtml)

function rebuild(base: string): string {
  if (!props.buildHtml) return base
  try {
    return props.buildHtml({
      pageSize: pageSize.value,
      orientation: orientation.value,
      fit: fitValue.value
    })
  } catch {
    return base
  }
}

watch(
  () => props.printHtml,
  (v) => {
    html.value = rebuild(v)
  }
)
watch([pageSize, orientation, fitMode, customPct], () => {
  html.value = rebuild(props.printHtml)
})

/** 预览：iframe 内为整份打印稿，按纸张比例缩放显示，滚动映射页码 */
const viewportRef = ref<HTMLElement | null>(null)
const iframeRef = ref<HTMLIFrameElement | null>(null)
const { width: viewportW } = useElementSize(viewportRef)
const contentH = ref(0)
const currentPage = ref(1)

/** 纸张可打印高度（未缩放内容的 CSS px） */
const printableHPx = computed(() => {
  const m = pageMarginOf(pageSize.value)
  return Math.max(1, paperPx.value.h - m.v * PRINT_MM_TO_PX * 2)
})

const totalPages = computed(() => {
  if (contentH.value <= 0) return 1
  const unscaledH = contentH.value / zoom.value
  return Math.max(1, Math.ceil(unscaledH / printableHPx.value - 0.02))
})

const scale = computed(() => {
  const avail = (viewportW.value || 520) - 4
  return Math.max(0.1, Math.min(1.4, avail / paperPx.value.w))
})

/** 屏幕上一页内容的高度（px） */
const pageVisualH = computed(() => printableHPx.value * zoom.value * scale.value)

function measure(): void {
  const doc = iframeRef.value?.contentDocument
  if (!doc) {
    contentH.value = paperPx.value.h
    return
  }
  const h = Math.max(
    doc.body?.scrollHeight ?? 0,
    doc.documentElement?.scrollHeight ?? 0,
    paperPx.value.h
  )
  contentH.value = h
  currentPage.value = 1
  void nextTick(() => {
    if (viewportRef.value) viewportRef.value.scrollTop = 0
  })
}

function onScroll(): void {
  const el = viewportRef.value
  if (!el || pageVisualH.value <= 0) return
  const p = Math.floor(el.scrollTop / pageVisualH.value) + 1
  currentPage.value = Math.max(1, Math.min(totalPages.value, p))
}

function gotoPage(page: number): void {
  const target = Math.max(1, Math.min(totalPages.value, page))
  currentPage.value = target
  if (viewportRef.value) viewportRef.value.scrollTop = (target - 1) * pageVisualH.value
}

/** 页面范围解析（如 1-2、1,3） */
const parsedRanges = computed<Array<{ from: number; to: number }> | undefined>(() => {
  if (rangeMode.value === 'all') return undefined
  if (rangeMode.value === 'current') return [{ from: currentPage.value, to: currentPage.value }]
  const out: Array<{ from: number; to: number }> = []
  for (const part of customRange.value.split(/[,，、\s]+/).filter(Boolean)) {
    const m = part.match(/^(\d+)\s*[-~－]\s*(\d+)$/)
    if (m) {
      const a = Number(m[1])
      const b = Number(m[2])
      out.push({ from: Math.min(a, b), to: Math.max(a, b) })
    } else if (/^\d+$/.test(part)) {
      const n = Number(part)
      out.push({ from: n, to: n })
    }
  }
  return out.length > 0 ? out : undefined
})
const rangeText = computed(
  () => parsedRanges.value?.map((r) => (r.from === r.to ? `${r.from}` : `${r.from}-${r.to}`)).join('、') ?? ''
)

const printerOptions = computed(() =>
  printers.value.map((p) => ({
    value: p.name,
    label: `${p.displayName}${p.isDefault ? '（默认）' : ''}`
  }))
)

async function loadPrinters(): Promise<void> {
  try {
    printers.value = await window.api.listPrinters()
    const def = printers.value.find((p) => p.isDefault) ?? printers.value[0]
    selectedPrinter.value = def?.name ?? ''
  } catch {
    printers.value = []
  }
}

function close(): void {
  emit('update:visible', false)
  errorMsg.value = ''
}

/** 打印（静默输出到所选打印机，页码范围/方向/灰度/份数按当前设置） */
async function doPrint(): Promise<void> {
  if (!html.value) return
  if (rangeMode.value === 'custom' && !parsedRanges.value) {
    errorMsg.value = '页码范围格式无效，请填写如 1-2 或 1,3'
    return
  }
  printing.value = true
  errorMsg.value = ''
  try {
    const result = await window.api.printHtml(html.value, {
      silent: true,
      copies: copies.value,
      collate: true,
      deviceName: selectedPrinter.value || undefined,
      pageSize: pageSize.value,
      landscape: landscape.value,
      color: !grayscale.value,
      pageRanges: parsedRanges.value
    })
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

/** 调起 Windows 系统打印对话框（页面范围/缩放/方向等交给驱动程序处理） */
async function openSystemPrint(): Promise<void> {
  if (!html.value) return
  printing.value = true
  errorMsg.value = ''
  try {
    await window.api.printHtml(html.value, {
      silent: false,
      deviceName: selectedPrinter.value || undefined,
      pageSize: pageSize.value,
      landscape: landscape.value,
      color: !grayscale.value
    })
  } catch (e) {
    errorMsg.value = (e as Error).message
  } finally {
    printing.value = false
  }
}

onMounted(() => {
  void loadPrinters()
})
</script>

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
  width: 1040px;
  max-width: 96vw;
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
  cursor: pointer;
}
.icon-btn:hover {
  color: var(--red);
  border-color: var(--red);
}
.preview-body {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 14px;
  padding: 14px 18px;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}
.preview-page {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.preview-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: var(--text-sub);
  background: var(--card2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 7px 12px;
}
.bar-item b {
  color: var(--text);
}
.preview-nav {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}
.nav-btn {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  border: 1px solid var(--border-strong);
  background: var(--card);
  color: var(--text-sub);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transition: 0.15s;
}
.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.nav-btn:not(:disabled):hover {
  border-color: var(--primary);
  color: var(--primary);
}
.nav-text {
  font-size: 12px;
  color: var(--text-sub);
}
.preview-viewport {
  flex: 1;
  min-height: 300px;
  background: var(--card2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}
.preview-canvas {
  position: relative;
  flex-shrink: 0;
}
.preview-scaler {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: top left;
  background: #fff;
  box-shadow: var(--shadow);
}
.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
  display: block;
  pointer-events: none;
}
.preview-hint {
  font-size: 11px;
  color: var(--text-mute);
  text-align: center;
}
.preview-ops {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  padding-right: 2px;
}
.ops-sec {
  background: var(--card2);
  border: 1px solid var(--border);
  border-radius: 11px;
  padding: 11px 12px;
}
.ops-label {
  font-size: 11.5px;
  color: var(--text-mute);
  margin-bottom: 7px;
}
.ops-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ops-grow {
  flex: 1;
  min-width: 0;
}
.copies-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.step-btn {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 1px solid var(--border-strong);
  background: var(--card);
  color: var(--text-sub);
  cursor: pointer;
  transition: 0.15s;
}
.step-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}
.copies-num {
  font-size: 14px;
  font-weight: 700;
  min-width: 22px;
  text-align: center;
}
.radio-row {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  color: var(--text-sub);
  padding: 4px 6px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.15s;
}
.radio-row.on {
  color: var(--primary);
  font-weight: 600;
  background: var(--primary-soft);
}
.radio-row input[type='radio'] {
  accent-color: var(--primary);
  cursor: pointer;
}
.range-input,
.pct-input {
  height: 26px;
  border-radius: 8px;
  border: 1px solid var(--border-strong);
  background: var(--card);
  color: var(--text);
  font-size: 12px;
  padding: 0 8px;
  outline: none;
}
.range-input {
  flex: 1;
  min-width: 0;
}
.pct-input {
  width: 62px;
  text-align: right;
}
.range-input:focus,
.pct-input:focus {
  border-color: var(--primary);
}
.pct-unit {
  font-size: 12px;
}
.ops-note {
  margin-top: 6px;
  font-size: 11.5px;
  color: var(--text-mute);
}
.ops-note.err {
  color: var(--red);
}
.chip-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 7px;
}
.role-chip {
  padding: 7px 0;
  text-align: center;
  border: 1px solid var(--border-strong);
  border-radius: 9px;
  font-size: 12px;
  color: var(--text-sub);
  cursor: pointer;
  transition: 0.15s;
}
.role-chip.sel {
  background: var(--primary-soft);
  color: var(--primary);
  border-color: var(--primary);
  font-weight: 600;
}
.check-row {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 10px;
  font-size: 12.5px;
  color: var(--text-sub);
  cursor: pointer;
  user-select: none;
}
.check-box {
  width: 15px;
  height: 15px;
  margin: 0;
  cursor: pointer;
  accent-color: var(--primary);
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
