/* eslint-disable no-new */
const meta = require('./package.json')
const { ipcRenderer } = require('electron')

const Vue = window.Vue

const get = key => ipcRenderer.invoke('state', key)

new Vue({
  el: '#main',
  data: {
    version: meta.version,
    state: {
      completeNum: undefined,
      completeNumNow: undefined,
      delay: undefined,
      INTERVAL: undefined,
      url: undefined,
      update: undefined,
      updateProgress: undefined,
      updateDownloaded: undefined,
      nickname: undefined,
      log: undefined,
      pending: undefined,
      pulls: undefined,
      online: undefined,
      homes: []
    },
    logs: [],
    uptime: undefined,
    interval: undefined,
    nickname: undefined
  },
  watch: {
    interval(value) {
      if (value) {
        ipcRenderer.invoke('updateInterval', Number(value))
      }
    },
    nickname(value) {
      ipcRenderer.invoke('updateNickname', value)
    },
    'state.log'(log) {
      this.logs.unshift(log)
      if (this.logs.length > 233) {
        this.logs.pop()
      }
    }
  },
  methods: {
    close() {
      ipcRenderer.invoke('close')
    },
    restart() {
      ipcRenderer.invoke('restart')
    }
  },
  computed: {
    intervalWarning() {
      return this.interval && Number(this.interval) < 500
    },
    homes() {
      return this.state.homes
        .map(({ runtime = 'Home', version = '', docker, platform = '', name = 'DD', resolves, rejects, id }) => ({
          id,
          name,
          sum: resolves + rejects,
          resolves,
          runtime,
          platform: docker || platform,
          version
        }))
        .sort(({ resolves: a }, { resolves: b }) => b - a)
    }
  },
  async created() {
    const logs = await get('logs')
    logs.shift()
    this.logs = logs

    ipcRenderer.on('stateUpdate', (_events, key, value) => {
      this.state[key] = value
    })

    Object.keys(this.state).forEach(async key => {
      this.state[key] = await get(key)
    })

    const interval = () => {
      (async () => {
        this.uptime = await ipcRenderer.invoke('uptime')
      })()
      return interval
    }
    setInterval(interval(), 1000)
  },
  async mounted() {
    document.getElementById('main').style.display = 'block'
    await this.$nextTick()
    ipcRenderer.invoke('ready')
  }
})
