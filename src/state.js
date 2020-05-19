const EventEmitter = require('events')

const stateEmitter = new EventEmitter()

const state = new Proxy({
  completeNum: 0,
  completeNumNow: 0,
  logs: [],
  homes: [],
  danmakuLength: 0
}, {
  set(target, key, value) {
    target[key] = value
    stateEmitter.emit(key, value)
  }
})

stateEmitter.on('log', log => {
  state.logs.unshift(log)
  if (state.logs.length > 233) {
    state.logs.pop()
  }
})

module.exports = { state, stateEmitter }
