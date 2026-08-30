import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// 通过 contextBridge 暴露给渲染进程的 API。
// 后续打印（webContents.print）、读卡器等桌面能力在这里扩展。
const api = {
  platform: process.platform
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
