const { app, BrowserWindow, shell } = require('electron')
const { once } = require('events')

const ready = once(app, 'ready')

let win

const createWindow = async () => {
  await ready
  win = new BrowserWindow({
    width: 800,
    height: 600,
    titleBarStyle: 'hiddenInset',
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  win.removeMenu()

  win.loadFile('index.html')

  win.on('closed', () => {
    win = null
  })
  win.webContents.on('new-window', (e, url) => {
    e.preventDefault()
    shell.openExternal(url)
  })
}

app.on('window-all-closed', () => {})

const getWin = () => win

module.exports = { getWin, createWindow }
