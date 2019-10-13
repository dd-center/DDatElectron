const { version: VERSION } = require('../package.json')
const WebSocket = require('ws')
const got = require('got')

console.log(`
${Array(80).fill('D').join('')}
Thank you for participating DD@Home,
Please read README.md for more information.
${Array(80).fill('D').join('')}
`)

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

const parse = string => {
  try {
    const json = JSON.parse(string)
    if (json) {
      const { key, data: { type, url } } = json
      if (type === 'http') {
        return { key, url }
      }
    }
  } catch (_) {
    return undefined
  }
}

module.exports = async ({ state, db }) => {
  let PARALLEL = 32
  let INTERVAL = await db.get('INTERVAL').catch(() => 680)
  let nickname = await db.get('nickname').catch(() => undefined)
  let ws

  const connect = () => new Promise(resolve => {
    let url = new URL('wss://cluster.vtbs.moe')
    url.searchParams.set('runtime', `electronv${process.versions.electron}`)
    url.searchParams.set('version', VERSION)
    url.searchParams.set('platform', process.platform)

    if (nickname) {
      url.searchParams.set('name', nickname)
    }

    console.log(`using: ${url}`)
    state.nickname = nickname
    state.url = url.href
    state.INTERVAL = INTERVAL

    ws = new WebSocket(url)

    const secureSend = data => {
      if (ws.readyState === 1) {
        ws.send(data)
        return true
      }
    }

    let pending = []

    ws.on('message', async message => {
      const json = parse(message)
      if (json) {
        const resolve = pending.shift(pending)
        if (resolve) {
          console.log('job received', json.url)
          resolve(json)
        }
      }
    })

    const processer = async () => {
      await wait(INTERVAL * PARALLEL * Math.random())
      while (true) {
        const now = Date.now()
        const { key, url } = await new Promise(resolve => {
          pending.push(resolve)
          secureSend('DDhttp')
        })
        const time = Date.now()
        const { body } = await got(url).catch(e => ({ body: JSON.stringify({ code: e.statusCode }) }))
        const result = secureSend(JSON.stringify({
          key,
          data: body
        }))
        if (result) {
          console.log(`job complete ${((Date.now() - time) / 1000).toFixed(2)}s`, INTERVAL * PARALLEL - Date.now() + now)
          state.completeNum++
        }
        await wait(INTERVAL * PARALLEL - Date.now() + now)
      }
    }

    ws.on('open', () => {
      console.log('DD@Home connected')
      Array(PARALLEL).fill().map(processer)
    })

    ws.on('error', e => {
      console.error(`error: ${e.message}`)
    })

    ws.on('close', (n, reason) => {
      console.log('closed', n, reason)
      if (reason === 'User Reload') {
        resolve()
      } else {
        setTimeout(resolve, 1000)
      }
    })
  })

  ;

  (async () => {
    while (true) {
      await connect()
    }
  })()

  const getWs = () => ws
  const updateInterval = interval => {
    db.put('INTERVAL', interval)
    INTERVAL = interval
  }
  const updateNickname = name => {
    db.put('nickname', name)
    nickname = name
  }

  return { getWs, updateInterval, updateNickname }
}
