const { join } = require('path')
const { once } = require('events')
const { app } = require('electron')
const level = require('level')

const ready = once(app, 'ready')

module.exports = async ({ state, stateEmitter }) => {
  await ready
  const db = level(join(app.getPath('userData'), './db'), { valueEncoding: 'json' })

  state.completeNum += await db.get('completeNum').catch(() => 0)
  stateEmitter.on('completeNum', value => db.put('completeNum', value))

  return db
}
