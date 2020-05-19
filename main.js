/* eslint-disable no-new */
const { ipcRenderer } = require('electron')
const { v4: uuidv4 } = require('uuid')
const gql = require('graphql-tag')

const meta = require('./package.json')

const Vue = window.Vue

const updates = [
  ['1.8.1', '- 更新electron-updater修复一个导致软件无法更新的问题'],
  ['1.8.0', `
    - 改进Main-Renderer进程的IPC弹幕同步以及渲染弹幕的逻辑
    - 记住50个弹幕历史→_→!
    第一次写更新日志
    有时间把之前的补上吧`]
].map(([version, message]) => [version, message.split('\n')]).reverse()

const get = key => ipcRenderer.invoke('state', key)
const query = async (document, variableValues) => {
  const result = await ipcRenderer.invoke('query', document, variableValues)
  if (!result) {
    throw new Error('query failed')
  }
  return result
}

window.query = query

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
      power: 0,
      online: undefined,
      homes: [],
      danmakuLength: 0,
      uuid: undefined,
      danmaku: undefined
    },
    displayDanmaku: {
      danmakuPack: [],
      showingPack: [],
      observer: undefined
    },
    logs: [],
    uptime: undefined,
    interval: undefined,
    nickname: undefined,
    uuid: undefined,
    danmaku: '',
    danmakuWait: false,
    updates
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
    },
    async danmakuDetectors(value) {
      await this.$nextTick()
      value.forEach(({ i }) => {
        this.displayDanmaku.observer.observe(document.getElementById(`danmakuDetectors_${i}`))
      })
    },
    'displayDanmaku.showingPack'(value) {
      value.forEach((w, i) => {
        if (w) {
          if (!this.displayDanmaku.danmakuPack[i]) {
            this.getDanmaku(i)
          }
        }
      })
    },
    'state.danmakuLength'() {
      this.getDanmaku(this.displayDanmaku.danmakuPack.length - 1)
    }
  },
  methods: {
    send(e) {
      e.preventDefault()
      if (this.danmaku && !this.danmakuWait) {
        this.danmakuWait = true
        setTimeout(() => {
          this.danmakuWait = false
        }, 1000)

        ipcRenderer.send('danmaku', this.danmaku)

        this.danmaku = ''
      }
    },
    close() {
      if (this.uuid) {
        ipcRenderer.invoke('updateUUID', this.uuid)
      }
      ipcRenderer.invoke('close')
    },
    restart() {
      ipcRenderer.invoke('restart')
    },
    randomUUID() {
      this.uuid = uuidv4()
    },
    async getDanmaku(i) {
      const number = Math.min(100, this.state.danmakuLength - i * 100)
      const skip = i * 100
      const { danmaku: { danmaku } = {} } = await query(gql`query getDanmaku($number:Int!,$skip:Int!) {danmaku{danmaku(number:$number, skip:$skip){name text}}}`, { number, skip })
        .catch(() => ({}))
      if (danmaku) {
        Vue.set(this.displayDanmaku.danmakuPack, i, danmaku
          .map(({ name, text }, i) => ({ name, text, n: i + skip }))
          .map(({ name, text, n }) => ({ name, text, n, bottom: n * 24, i: n % 300 })))
      }
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
    },
    powerSec() {
      const round = this.state.power / 60
      if (round < 1) {
        return Math.round(round * 10) / 10
      }
      return Math.round(round)
    },
    danmakuHeight() {
      return this.state.danmakuLength * 24
    },
    danmakuDetectors() {
      const num = Math.trunc(this.state.danmakuLength / 100) + 1
      const height = 100 * 24
      return Array(num)
        .fill(height)
        .map((height, i) => ({ height, bottom: i * height, i }))
    },
    danmakus() {
      const blank = Array(300).fill(-100).map((bottom, i) => ({ bottom, i }))
      const showing = this.displayDanmaku.danmakuPack.filter((_, i) => this.displayDanmaku.showingPack[i])
      showing.flat().forEach(({ name, text, bottom, i }) => {
        blank[i] = { name, text, bottom, i }
      })
      return blank
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

    this.displayDanmaku.observer = new IntersectionObserver(entries => entries.forEach(({ isIntersecting, target }) => {
      const n = Number(target.getAttribute('n'))
      if (isIntersecting) {
        Vue.set(this.displayDanmaku.showingPack, n, true)
      } else {
        Vue.set(this.displayDanmaku.showingPack, n, false)
      }
    }), {
      root: document.getElementById('danmakuBox'),
      rootMargin: '600px 0px 600px 0px',
      thresholds: [0]
    })
  },
  async mounted() {
    document.getElementById('main').style.display = 'block'
    await this.$nextTick()
    ipcRenderer.invoke('ready')
  }
})
