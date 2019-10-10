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
      completeNum: undefined,
      INTERVAL: undefined,
      url: undefined,
      update: undefined,
      updateProgress: undefined,
      updateDownloaded: undefined
    },
    uptime: undefined,
    interval: undefined
  },
  watch: {
    interval(value) {
      if (value) {
        send('updateInterval', Number(value))
      }
    }
  },
  methods: {
    close() {
      send('close')
    },
    restart() {
      send('restart')
    }
  },
  computed: {
    intervalWarning() {
      return this.interval && Number(this.interval) < 500
    }
  },
  async created() {
    ipcRenderer.on('stateUpdate', (_events, key, value) => {
      this.state[key] = value
    })

    Object.keys(this.state).forEach(async key => {
      this.state[key] = await get(key)
    })

    const interval = () => {
      (async () => {
        this.uptime = await send('uptime')
      })()
      return interval
    }
    setInterval(interval(), 1000)
  }
})
