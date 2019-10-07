const EventEmitter = require('events')

const stateEmitter = new EventEmitter()

const state = new Proxy({
  completeNum: 0
}, {
  set(target, key, value) {
    target[key] = value
    stateEmitter.emit(key, value)
  }
})

module.exports = { state, stateEmitter }
