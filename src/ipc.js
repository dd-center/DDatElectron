const { ipcMain, BrowserWindow: { fromWebContents } } = require('electron')
const moment = require('moment')
moment.locale('zh-cn')

module.exports = ({ getWin, state, stateEmitter, getWs, updateInterval, quitAndInstall, createWindow, updateNickname }) => {
  const router = {
    state(_e, key) {
      return state[key]
    },
    updateInterval,
    updateNickname,
    close() {
      const ws = getWs()
      if (ws.readyState === 1) {
        ws.close(3000, 'User Reload')
      }
    },
    restart() {
      quitAndInstall()
    },
    ready({ sender }) {
      fromWebContents(sender).show()
    },
    uptime() {
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
    }
  }

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
  subscribe('INTERVAL')
  subscribe('nickname')
  subscribe('url')
  subscribe('update')
  subscribe('updateProgress')
  subscribe('updateDownloaded')

  ipcMain.on('get', (e, channel, key, ...args) => {
    const route = router[channel]
    if (route) {
      e.reply(key, route(e, ...args))
    }
  })

  createWindow()
}
