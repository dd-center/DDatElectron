const { state, stateEmitter } = require('./state')
const connect = require('./ws')
const { getWin } = require('./window')
const sync = require('./ipc')

const { getWs, updateInterval } = connect({ state })
sync({ getWin, updateInterval, state, stateEmitter, getWs })
