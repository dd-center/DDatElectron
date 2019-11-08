const { state, stateEmitter } = require('./state')
const connect = require('./ws')
const { getWin, createWindow } = require('./window')
const sync = require('./ipc')
const updater = require('./updater')
const open = require('./db')
const tray = require('./tray')

const autoUpdater = updater({ state })

open({ state, stateEmitter })
  .then(async db => {
    const { getWs, updateInterval, updateNickname } = await connect({ state, db })
    const quitAndInstall = async () => {
      await db.close()
      autoUpdater.quitAndInstall()
    }
    tray({ createWindow, getWin })
    sync({ getWin, updateInterval, updateNickname, state, stateEmitter, getWs, quitAndInstall, createWindow })
  })
