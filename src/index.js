const { events } = require('./ws')
const { getWin } = require('./window')
const connect = require('./ipc')

connect({ getWin, events })
