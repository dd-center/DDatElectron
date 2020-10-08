/* eslint-disable no-unexpected-multiline */
/* eslint-disable func-call-spacing */
const gql = require('graphql-tag')
const { v4: uuidv4 } = require('uuid')

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

const makeURL = ({ nickname, uuid }) => {
  const url = new URL(base)
  url.searchParams.set('runtime', `electronv${process.versions.electron}`)
  url.searchParams.set('version', VERSION)
  url.searchParams.set('platform', process.platform)

  if (uuid) {
    url.searchParams.set('uuid', uuid)
  }
  if (nickname) {
    url.searchParams.set('name', nickname)
  }

  return url
}

module.exports = async ({ state, db }) => {
  const PING_INTERVAL = 1000 * 30
  const INTERVAL = await db.get('INTERVAL').catch(() => 840)
  let wsLimit = await db.get('wsLimit').catch(() => 3000)
  let nickname = await db.get('nickname').catch(() => undefined)
  let uuid = await db.get('uuid').catch(() => uuidv4())

  const wsURL = makeURL({ nickname, uuid })

  state.log = `using: ${wsURL}`
  console.log(`using: ${wsURL}`)
  state.nickname = nickname
  state.wsLimit = wsLimit

  const dd = new DDAtHome(wsURL, { PING_INTERVAL, INTERVAL, wsLimit })

  const query = async (document, variableValues = {}) => {
    const result = await dd.ask({ type: 'GraphQL', document, variableValues })
    if (!result) {
      throw new Error('query failed')
    }
    return result
  }

  dd.on('open', () => {
    state.INTERVAL = dd.INTERVAL
    state.url = dd.url.href
    state.nickname = nickname
    state.uuid = uuid
    state.log = 'DD@Home connected'
    console.log('DD@Home connected')
  })

  dd.on('open', async () => {
    const { danmaku: { length = state.danmakuLength }, id } = await query(gql`query {danmaku{length}, id}`).catch(() => ({}))
    state.danmakuLength = length
    state.id = id
  })

  dd.on('url', url => console.log('job received', url))

  dd.on('relay', (...msg) => {
    const m = msg.join(' ')
    console.log('relay', ...msg)
    state.log = m
  })

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

  dd.on('payload', ({ type }) => {
    if (type === 'danmaku') {
      query(gql`{danmaku{length}}`)
        .then(({ danmaku: { length } }) => {
          state.danmakuLength = length
        })
        .catch(() => {})
    }
  })

  ;

  (f => w => f(f, w()))
  (f => w => f(f, w()))
  (async () => {
    while (true) {
      const pause = wait(233)
      if (dd.ws.readyState === 1) {
        const { pending } = await query(gql`{ pending }`).catch(() => state)
        state.pending = pending
      }
      await pause
    }
  })
  (async () => {
    while (true) {
      if (dd.ws.readyState === 1) {
        const pause = wait(1000 * 5)
        const { homes, online, power, rooms: { length: roomLength }, totalActive } = await query(gql`{ online rooms { length } totalActive power: DD homes { id resolves: success rejects: fail runtime platform version name docker uuid } }`).catch(() => state)
        state.homes = homes
        state.online = online
        state.power = power
        state.roomLength = roomLength
        state.totalActive = totalActive
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
    nickname = name
    dd.url = makeURL({ nickname, uuid })
  }
  const updateUUID = (id = uuidv4()) => {
    db.put('uuid', id)
    uuid = id
    dd.url = makeURL({ nickname, uuid })
  }
  const updateWebSocketLimit = limit => {
    db.put('wsLimit', limit)
    wsLimit = limit
    dd.wsLimit = wsLimit
  }
  const sendDanmaku = danmaku => dd.ask({ type: 'danmaku', data: danmaku })

  return { getWs, updateInterval, updateNickname, sendDanmaku, updateUUID, updateWebSocketLimit, query }
}
