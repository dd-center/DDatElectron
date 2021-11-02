const { app, BrowserWindow, shell } = require('electron')
const { once } = require('events')
const { join } = require('path')

const ready = once(app, 'ready')

let win

app.allowRendererProcessReuse = true

const createWindow = async () => {
  await ready
  win = new BrowserWindow({
    width: 800,
    height: 600,
    titleBarStyle: 'hiddenInset',
    show: false,
    webPreferences: {
      preload: join(__dirname, '..', 'preload.js')
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

app.on('window-all-closed', () => { })

app.on('activate', () => {
  if (win) {
    win.show()
  } else {
    createWindow()
  }
})

const getWin = () => win

module.exports = { getWin, createWindow }
