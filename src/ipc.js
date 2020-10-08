const { ipcMain, BrowserWindow: { fromWebContents } } = require('electron')
const moment = require('moment')
moment.locale('zh-cn')

module.exports = ({ getWin, state, stateEmitter, getWs, updateInterval, quitAndInstall, createWindow, updateNickname, sendDanmaku, updateUUID, updateWebSocketLimit, query }) => {
  ipcMain.handle('query', (_e, document, variableValues) => query(document, variableValues).catch(() => undefined))

  ipcMain.handle('state', (_e, key) => state[key])
  ipcMain.handle('updateInterval', (_e, ...values) => updateInterval(...values))
  ipcMain.handle('updateNickname', (_e, ...values) => updateNickname(...values))
  ipcMain.handle('updateUUID', (_e, ...values) => updateUUID(...values))
  ipcMain.handle('updateWebSocketLimit', (_, ...values) => updateWebSocketLimit(...values))

  ipcMain.handle('close', _e => {
    const ws = getWs()
    if (ws.readyState === 1) {
      ws.close(3000, 'User Reload')
    }
  })
  ipcMain.handle('restart', quitAndInstall)
  ipcMain.handle('ready', ({ sender }) => fromWebContents(sender).show())
  ipcMain.handle('uptime', _e => {
    const uptime = process.uptime()
    const duration = moment.duration(uptime, 's')
    const result = []
    const d = Math.floor(duration.asDays())
    const h = duration.hours()
    const m = duration.minutes()
    const s = duration.seconds()
    if (d) {
      result.push(`${d} 天`)
    }
    if (h) {
      result.push(`${h} 时`)
    }
    if (m) {
      result.push(`${m} 分`)
    }
    if (s) {
      result.push(`${s} 秒`)
    }
    if (!result.length) {
      result.push('0 秒')
    }
    return result.join(' ')
  })

  ipcMain.on('danmaku', (_, danmaku) => sendDanmaku(danmaku))

  const subscribe = key => stateEmitter.on(key, value => {
    const win = getWin()
    if (win) {
      win.webContents.send('stateUpdate', key, value)
    }
  })

  subscribe('completeNum')
  subscribe('completeNumNow')
  subscribe('delay')
  subscribe('log')
  subscribe('danmakuLength')
  subscribe('danmaku')
  subscribe('INTERVAL')
  subscribe('nickname')
  subscribe('url')
  subscribe('update')
  subscribe('updateProgress')
  subscribe('updateDownloaded')
  subscribe('pending')
  subscribe('power')
  subscribe('online')
  subscribe('homes')
  subscribe('uuid')
  subscribe('id')
  subscribe('wsLimit')
  subscribe('totalActive')
  subscribe('roomLength')
  subscribe('livedRooms')

  createWindow()
}
