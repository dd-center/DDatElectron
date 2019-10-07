const { ipcMain } = require('electron')
const moment = require('moment')
moment.locale('zh-cn')

module.exports = ({ getWin, events, getCompleteNum }) => {
  const router = {
    completeNum() {
      return getCompleteNum()
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
      return result.join(' ')
    }
  }

  events.on('complete', completeNum => {
    const win = getWin()
    if (win) {
      win.webContents.send('complete', completeNum)
    }
  })

  ipcMain.on('get', (e, channel, key, ...args) => {
    const route = router[channel]
    if (route) {
      e.reply(key, route(...args))
    }
  })
}
