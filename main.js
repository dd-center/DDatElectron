/* eslint-disable no-new */
const meta = require('./package.json')
const { ipcRenderer } = require('electron')

const Vue = window.Vue

const send = (channel, ...args) => new Promise(resolve => {
  const key = String(Math.random())
  ipcRenderer.once(key, (_event, data) => resolve(data))
  ipcRenderer.send('get', channel, key, ...args)
})

const get = key => send('state', key)

new Vue({
  el: '#main',
  data: {
    version: meta.version,
    state: {
      completeNum: undefined
    },
    uptime: undefined
  },
  async created() {
    ipcRenderer.on('stateUpdate', (_events, key, value) => {
      this.state[key] = value
    })

    this.state.completeNum = await get('completeNum')

    const interval = () => {
      (async () => {
        this.uptime = await send('uptime')
      })()
      return interval
    }
    setInterval(interval(), 1000)
  }
})
