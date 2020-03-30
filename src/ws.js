/* eslint-disable no-unexpected-multiline */
/* eslint-disable func-call-spacing */
const { version: VERSION } = require('../package.json')
const DDAtHome = require('ddatnodejs')

console.log(`
${Array(80).fill('D').join('')}
Thank you for participating DD@Home,
Please read README.md for more information.
${Array(80).fill('D').join('')}
`)

const base = process.env.development ? 'ws://0.0.0.0:9013' : 'wss://cluster.vtbs.moe'

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

const makeURL = nickname => {
  const url = new URL(base)
  url.searchParams.set('runtime', `electronv${process.versions.electron}`)
  url.searchParams.set('version', VERSION)
  url.searchParams.set('platform', process.platform)

  if (nickname) {
    url.searchParams.set('name', nickname)
  }

  return url
}

module.exports = async ({ state, db }) => {
  const PING_INTERVAL = 1000 * 30
  const INTERVAL = await db.get('INTERVAL').catch(() => 840)
  let nickname = await db.get('nickname').catch(() => undefined)

  const wsURL = makeURL(nickname)

  state.log = `using: ${wsURL}`
  console.log(`using: ${wsURL}`)
  state.nickname = nickname

  const dd = new DDAtHome(wsURL, { PING_INTERVAL, INTERVAL })

  dd.on('open', () => {
    state.INTERVAL = dd.INTERVAL
    state.url = dd.url.href
    state.nickname = nickname
    state.log = 'DD@Home connected'
    console.log('DD@Home connected')
  })

  dd.on('open', async () => {
    state.danmakus = [...await dd.ask('danmakuHistory')].reverse()
  })

  dd.on('url', url => console.log('job received', url))

  dd.on('done', (now, duration, url) => {
    state.delay = Math.round(process.uptime() * 1000 / state.completeNumNow)
    console.log(`job complete ${(duration / 1000).toFixed(2)}s`, state.delay)
    state.log = url
    state.completeNum++
    state.completeNumNow++
  })

  dd.on('close', (n, reason) => {
    state.log = `closed, ${n}, ${reason}`
    console.log('closed', n, reason)
  })

  dd.on('payload', ({ type, data }) => {
    if (type === 'danmaku') {
      const { nickname, danmaku } = data
      state.danmaku = [nickname, danmaku]
    }
  })

  ;

  (f => w => f(f, w()))
  (f => w => f(f, w()))
  (async () => {
    while (true) {
      const pause = wait(233)
      if (dd.ws.readyState === 1) {
        state.pending = await dd.ask('pending').catch(() => state.pending)
      }
      await pause
    }
  })
  (async () => {
    while (true) {
      if (dd.ws.readyState === 1) {
        const pause = wait(1000 * 5)
        state.homes = await dd.ask('homes').catch(() => state.homes)
        state.online = await dd.ask('online').catch(() => state.online)
        state.power = await dd.ask('power').catch(() => state.power)
        await pause
      } else {
        await wait(500)
      }
    }
  })

  const getWs = () => dd.ws
  const updateInterval = interval => {
    db.put('INTERVAL', interval)
    dd.INTERVAL = interval
  }
  const updateNickname = name => {
    db.put('nickname', name)
    dd.url = makeURL(name)
    nickname = name
  }
  const sendDanmaku = danmaku => dd.ask({ type: 'danmaku', data: danmaku })

  return { getWs, updateInterval, updateNickname, sendDanmaku }
}
