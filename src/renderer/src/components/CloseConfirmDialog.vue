<template>
  <div v-if="visible" class="close-mask" @click.self="cancel">
    <div class="close-panel">
      <div class="close-hd">
        <span class="close-title">关闭 HIS 医生工作站</span>
        <button class="icon-btn" title="取消" @click="cancel">✕</button>
      </div>
      <div class="close-body">
        <div class="close-desc">请选择关闭方式，未就诊完成的接诊内容已自动保存。</div>
        <div class="close-options">
          <div class="opt-card opt-tray" @click="chooseTray">
            <div class="opt-icon">🖥</div>
            <div class="opt-text">
              <div class="opt-name">挂到后台</div>
              <div class="opt-sub">窗口隐藏，在系统托盘继续运行；点击托盘图标或双击应用图标即可恢复</div>
            </div>
            <div class="opt-arrow">›</div>
          </div>
          <div class="opt-card opt-quit" @click="chooseQuit">
            <div class="opt-icon">⏻</div>
            <div class="opt-text">
              <div class="opt-name">全部关闭</div>
              <div class="opt-sub">完全退出应用，结束所有进程；下次启动需重新登录</div>
            </div>
            <div class="opt-arrow">›</div>
          </div>
        </div>
      </div>
      <div class="close-ft">
        <button class="btn btn-ghost" @click="cancel">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  visible: boolean
}>()
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void }>()

function cancel(): void {
  emit('update:visible', false)
}

function chooseTray(): void {
  emit('update:visible', false)
  window.api.hideToTray()
}

function chooseQuit(): void {
  emit('update:visible', false)
  window.api.quitApp()
}
</script>

<style scoped>
.close-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 20, 32, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  cursor: pointer;
  animation: fadeUp 0.18s ease;
}
.close-panel {
  width: 460px;
  max-width: 92vw;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  cursor: default;
}
.close-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 0;
}
.close-title {
  font-size: 15px;
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
.close-body {
  padding: 10px 18px 18px;
}
.close-desc {
  font-size: 12.5px;
  color: var(--text-mute);
  line-height: 1.6;
  margin-bottom: 14px;
}
.close-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.opt-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 14px;
  border: 1px solid var(--border);
  border-radius: 13px;
  background: var(--card2);
  cursor: pointer;
  transition: 0.15s;
}
.opt-tray:hover {
  border-color: var(--primary);
  background: var(--primary-soft);
  transform: translateX(2px);
}
.opt-quit:hover {
  border-color: var(--red);
  background: var(--red-bg);
  transform: translateX(2px);
}
.opt-icon {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.opt-tray .opt-icon {
  background: var(--primary-soft);
  color: var(--primary);
}
.opt-quit .opt-icon {
  background: var(--red-bg);
  color: var(--red);
}
.opt-text {
  flex: 1;
  min-width: 0;
}
.opt-name {
  font-size: 13.5px;
  font-weight: 600;
}
.opt-tray .opt-name {
  color: var(--primary);
}
.opt-quit .opt-name {
  color: var(--red);
}
.opt-sub {
  font-size: 11.5px;
  color: var(--text-mute);
  line-height: 1.55;
  margin-top: 2px;
}
.opt-arrow {
  font-size: 18px;
  color: var(--text-mute);
}
.close-ft {
  display: flex;
  justify-content: flex-end;
  padding: 0 18px 16px;
}
</style>
