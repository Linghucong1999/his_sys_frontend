# 截图工具

前端页面截图采用 **Electron 原生截图**（`webContents.capturePage`），无需额外浏览器依赖。

## 使用方式

```bash
cd ../his_frontend
# Windows 命令行（PowerShell）
$env:HIS_CAPTURE_DIR = "E:\Agent_File_Edit\his_sys\his_frontend\docs\screenshots"
yarn dev

# 或 bash
HIS_CAPTURE_DIR="E:/Agent_File_Edit/his_sys/his_frontend/docs/screenshots" yarn dev
```

## 行为

1. 设置 `HIS_CAPTURE_DIR` 后启动 `yarn dev`，主进程依次加载各视图并保存 PNG：

| 文件 | 视图 |
|---|---|
| `login.png` | 登录页 |
| `workbench.png` | 智能工作台 |
| `p360.png` | 患者 360° 工作站（自动点击"调档接诊"进入） |
| `inpatient.png` | 住院工作站 |
| `emr.png` | 电子病历 EMR |
| `consultations.png` | 会诊管理 |

2. 截图完成后应用自动退出。

## 注意

- 截图依赖登录态：主窗口 localStorage 需已有登录 token（先手动登录一次）。
- 患者 360° 截图会触发一次"复诊调档"（新增就诊记录）；截图后如需恢复演示数据，删除 `his` 库业务集合后重启后端即可重新种子。
- 无 `HIS_CAPTURE_DIR` 时该逻辑完全不生效，正常开发不受影响。

## 实现位置

- 主进程截图逻辑：`his_frontend/src/main/index.ts` 的 `captureViewsIfRequested()`
- 图片存储目录：`his_frontend/docs/screenshots/`
