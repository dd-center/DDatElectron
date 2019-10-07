const { state, stateEmitter } = require('./state')
const connect = require('./ws')
const { getWin } = require('./window')
const sync = require('./ipc')

connect({ state })
sync({ getWin, state, stateEmitter })
