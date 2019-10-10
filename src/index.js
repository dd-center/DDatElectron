const { state, stateEmitter } = require('./state')
const connect = require('./ws')
const { getWin } = require('./window')
const sync = require('./ipc')
const updater = require('./updater')

const autoUpdater = updater({ state })

const { getWs, updateInterval } = connect({ state })
sync({ getWin, updateInterval, state, stateEmitter, getWs, autoUpdater })
