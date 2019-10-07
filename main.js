/* eslint-disable no-new */
const meta = require('./package.json')
const { ipcRenderer } = require('electron')

const Vue = window.Vue

const get = (channel, ...args) => new Promise(resolve => {
  const key = String(Math.random())
  ipcRenderer.once(key, (_event, data) => resolve(data))
  ipcRenderer.send('get', channel, key, ...args)
})

new Vue({
  el: '#main',
  data: {
    version: meta.version,
    completeNum: undefined,
    uptime: undefined
  },
  async created() {
    this.completeNum = await get('completeNum')
    ipcRenderer.on('complete', (_events, completeNum) => {
      this.completeNum = completeNum
    })

    const interval = () => {
      (async () => {
        this.uptime = await get('uptime')
      })()
      return interval
    }
    setInterval(interval(), 1000)
  }
})
