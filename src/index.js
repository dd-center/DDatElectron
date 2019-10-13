const { state, stateEmitter } = require('./state')
const connect = require('./ws')
const { getWin, createWindow } = require('./window')
const sync = require('./ipc')
const updater = require('./updater')
const { db, load } = require('./db')

const autoUpdater = updater({ state })

load({ state, stateEmitter })

connect({ state, db })
  .then(({ getWs, updateInterval, updateNickname }) => sync({ getWin, updateInterval, updateNickname, state, stateEmitter, getWs, autoUpdater, createWindow }))
