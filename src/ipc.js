const { ipcMain } = require('electron')
const moment = require('moment')
moment.locale('zh-cn')

module.exports = ({ getWin, state, stateEmitter, getWs, updateInterval, autoUpdater }) => {
  const router = {
    state(key) {
      return state[key]
    },
    updateInterval,
    close() {
      const ws = getWs()
      if (ws.readyState === 1) {
        ws.close(3000, 'User Reload')
      }
    },
    restart() {
      autoUpdater.quitAndInstall()
    },
    uptime() {
      const uptime = process.uptime()
      let duration = moment.duration(uptime, 's')
      let result = []
      let d = Math.floor(duration.asDays())
      let h = duration.hours()
      let m = duration.minutes()
      let s = duration.seconds()
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
  subscribe('INTERVAL')
  subscribe('url')
  subscribe('update')
  subscribe('updateProgress')
  subscribe('updateDownloaded')

  ipcMain.on('get', (e, channel, key, ...args) => {
    const route = router[channel]
    if (route) {
      e.reply(key, route(...args))
    }
  })
}
