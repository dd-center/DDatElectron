/* eslint-disable no-new */
const { ipcRenderer } = require('electron')
const { v4: uuidv4 } = require('uuid')
const gql = require('graphql-tag')

const moment = require('moment')

const meta = require('./package.json')

const Vue = window.Vue

moment.locale('zh-cn')

const updates = [
  ['1.0.1', '- 修复macOS一些兼容性问题'],
  ['1.1.0', '- 显示日志'],
  ['1.2.1', '- Electron升级到v7'],
  ['1.2.2', '- 降低并行, 加大间隔过小的警告范围'],
  ['1.2.3', '- 降低并行, 增加间隔'],
  ['1.5.0', '- 核心依赖DD@Nodejs'],
  ['1.6.0', '- 发弹幕功能'],
  ['1.7.0', '- 删去Pulls, 显示DD力'],
  ['1.7.4', '- 改进macOS的Notarize过程'],
  ['1.8.0', `
    - 改进Main-Renderer进程的IPC弹幕同步以及渲染弹幕的逻辑
    - 记住50个弹幕历史→_→!
    第一次写更新日志
    有时间把之前的补上吧`],
  ['1.8.1', '- 更新electron-updater修复一个导致软件无法更新的问题'],
  ['1.9.0', `
    - 把API改成GraphQL了
    - 记住数据的功能
    - 补上了一部分之前的更新记录`],
  ['1.9.1', `
    - 修好了弹幕会重叠的问题，感谢@ouuan
    - 显示弹幕时间
    - 自己的状态粗体显示`],
  ['1.9.2', '- 修好了1.9.1引入的导致不能显示界面问题，感谢@ouuan'],
  ['1.9.3', `
    - 降低electron版本尝试修复macOS不能公证的问题
    - 弹幕太长的提示`],
  ['1.9.4', `
    - 弹幕是空的时候不能发送@ouuan
    - 改变了弹幕时间的位置@ouuan`],
  ['1.9.6', '- 添加了命令行版本的下载链接'],
  ['1.10.0', `
    嘿嘿 好久不见
    - 更新了一部分依赖包
    - Electron 从8更新到10
    - 更新了DD@Home核心`],
  ['1.10.1', '- Electron 从10更新到8 (?)'],
  ['1.11.0', `
  - 更新Electron@8.5.2
  - 加入了转发连接直播间的功能`]
].map(([version, message]) => [version, message.split('\n')]).reverse()

const get = key => ipcRenderer.invoke('state', key)
const query = async (document, variableValues) => {
  const result = await ipcRenderer.invoke('query', document, variableValues)
  if (!result) {
    throw new Error('query failed')
  }
  return result
}

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
      id: undefined,
      danmaku: undefined,
      roomLength: 0,
      totalActive: 0,
      livedRooms: 0,
      wsLimit: undefined
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
    wsLimit: undefined,
    danmaku: '',
    danmakuWait: false,
    now: Date.now(),
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
    wsLimit(limit) {
      ipcRenderer.invoke('updateWebSocketLimit', limit)
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
      if (this.displayDanmaku.danmakuPack.length) {
        this.getDanmaku(this.displayDanmaku.danmakuPack.length - 1)
      }
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
      const { danmaku: { danmaku } = {} } = await query(gql`query getDanmaku($number:Int!,$skip:Int!) {danmaku{danmaku(number:$number, skip:$skip){name text timestamp}}}`, { number, skip })
        .catch(() => ({}))
      if (danmaku) {
        Vue.set(this.displayDanmaku.danmakuPack, i, danmaku
          .map(({ name, text, timestamp }, i) => ({ name, text, timestamp: Number(timestamp), n: i + skip }))
          .map(({ name, text, timestamp, n }) => ({ name, text, timestamp, n, bottom: n * 24, i: n % 300 })))
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
    longDanmaku() {
      return this.danmaku.length > 256
    },
    emptyDanmaku() {
      return this.danmaku.length === 0
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
      showing.flat().forEach(({ name, text, timestamp, bottom, i }) => {
        const momentTime = moment(timestamp)
        blank[i] = { name, text, absoluteTime: momentTime.local().format(), relativeTime: this.now - timestamp > 1000 * 60 * 60 ? momentTime.calendar() : momentTime.fromNow(), bottom, i }
      })
      return blank
    },
    averageActive() {
      const { roomLength, totalActive } = this.state
      return Math.round(totalActive / roomLength * 10) / 10
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
      this.now = Date.now()
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
      rootMargin: '600px 0px 600px 1000000px',
      thresholds: [0]
    })
  },
  async mounted() {
    document.getElementById('main').style.display = 'block'
    await this.$nextTick()
    ipcRenderer.invoke('ready')
  }
})
