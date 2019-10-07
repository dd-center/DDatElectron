const { version: VERSION } = require('../package.json')
const WebSocket = require('ws')
const got = require('got')

console.log(`
${Array(80).fill('D').join('')}
Thank you for participating DD@Home,
Please read README.md for more information.
${Array(80).fill('D').join('')}
`)

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

module.exports = ({ state }) => {
  let PARALLEL = 8
  let INTERVAL = 680
  let nickname

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
    state.url = url
    state.INTERVAL = INTERVAL

    const ws = new WebSocket(url)
    ws.on('message', async message => {
      const json = parse(message)
      if (json) {
        const now = Date.now()
        const { key, url } = json
        console.log('job received', url)
        const time = Date.now()
        const { body } = await got(url).catch(e => ({ body: { code: e.statusCode } }))
        console.log(`job complete ${((Date.now() - time) / 1000).toFixed(2)}s`)
        state.completeNum++
        ws.send(JSON.stringify({
          key,
          data: body
        }))
        setTimeout(() => ws.send('DDhttp'), INTERVAL * PARALLEL - Date.now() + now)
      }
    })

    ws.on('open', () => {
      console.log('DD@Home connected')
      Array(PARALLEL).fill().map(() => ws.send('DDhttp'))
    })

    ws.on('error', e => {
      console.error(`error: ${e.message}`)
    })

    ws.on('close', n => {
      console.log(`closed ${n}`)
      setTimeout(resolve, 1000)
    })
  })

  ;

  (async () => {
    while (true) {
      await connect()
    }
  })()
}
