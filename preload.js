const { ipcRenderer, contextBridge } = require('electron')
const { v4: uuidv4 } = require('uuid')
const gql = require('graphql-tag')

const moment = require('moment')

const meta = require('./package.json')

require('./vue/vue.js')

moment.locale('zh-cn')

const get = key => ipcRenderer.invoke('state', key)
const query = async (document, variableValues) => {
  const result = await ipcRenderer.invoke('query', document, variableValues)
  if (!result) {
    throw new Error('query failed')
  }
  return result
}

contextBridge.exposeInMainWorld('app', {
  uuidv4,
  gql,
  meta,
  get,
  query,
  momentTime: timestamp => {
    const momentTime = moment(timestamp)
    return { absoluteTime: momentTime.local().format(), calendar: momentTime.calendar(), fromNow: momentTime.fromNow() }
  },
  send: ipcRenderer.send,
  invoke: ipcRenderer.invoke,
  on: name => {
    ipcRenderer.on(name, (_, ...args) => {
      const detail = { name, args }
      const event = new CustomEvent('electron-ipc', { detail })
      window.dispatchEvent(event)
    })
  },
})
