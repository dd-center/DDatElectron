const { state, stateEmitter } = require('./state')
const connect = require('./ws')
const { getWin, createWindow } = require('./window')
const sync = require('./ipc')
const updater = require('./updater')
const open = require('./db')

const autoUpdater = updater({ state })

open({ state, stateEmitter })
  .then(async db => {
    const { getWs, updateInterval, updateNickname } = await connect({ state, db })
    sync({ getWin, updateInterval, updateNickname, state, stateEmitter, getWs, autoUpdater, createWindow })
  })
