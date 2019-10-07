const { events, getCompleteNum } = require('./ws')
const { getWin } = require('./window')
const connect = require('./ipc')

connect({ getWin, events, getCompleteNum })
