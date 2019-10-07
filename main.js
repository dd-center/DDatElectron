/* eslint-disable no-new */
const meta = require('./package.json')
const { ipcRenderer } = require('electron')

const Vue = window.Vue

const get = (channel, ...args) => new Promise(resolve => {
  const key = String(Math.random())
  ipcRenderer.once(key, (_event, data) => resolve(data))
  ipcRenderer.send('get', channel, key, ...args)
})

document.getElementById('version').innerText = `v${meta.version}`

new Vue({
  el: '#about',
  data: {
    uptime: ''
  },
  mounted() {
    const interval = () => {
      (async () => {
        this.uptime = await get('uptime')
      })()
      return interval
    }
    setInterval(interval(), 1000)
  }
})
