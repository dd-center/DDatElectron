const { app } = require('electron')
const { join } = require('path')
const level = require('level')

const db = level(join(app.getPath('userData'), './db'), { valueEncoding: 'json' })

const load = async ({ state, stateEmitter }) => {
  state.completeNum += await db.get('completeNum').catch(() => 0)

  stateEmitter.on('completeNum', value => {
    db.put('completeNum', value)
  })
}

module.exports = { db, load }
