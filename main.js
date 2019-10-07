const meta = require('./package.json')
const { ipcRenderer } = require('electron')

const get = (channel, ...args) => new Promise(resolve => {
  const key = String(Math.random())
  ipcRenderer.once(key, (_event, data) => resolve(data))
  ipcRenderer.send('get', channel, key, ...args)
})

document.getElementById('version').innerText = `v${meta.version}`

const interval = () => {
  (async () => {
    document.getElementById('uptime').innerText = await get('uptime')
  })()
  return interval
}

setInterval(interval(), 1000)
