/* eslint-disable no-unexpected-multiline */
/* eslint-disable func-call-spacing */
const { app, Menu, Tray, nativeImage } = require('electron')
const { join } = require('path')
const { once } = require('events')

const { version } = require('../package.json')

const ready = once(app, 'ready')
let tray

module.exports = async ({ createWindow, getWin }) => {
  await ready
  tray = new Tray(nativeImage.createFromPath(join(__dirname, '/iconTemplate.png')))
  const contextMenu = Menu.buildFromTemplate([{
    label: `DD@Electron ${version}`,
    click() {
      const win = getWin()
      if (win) {
        win.show()
      } else {
        createWindow()
      }
    }
  }, {
    label: '退出',
    click() {
      app.quit()
    }
  }])
  tray.setToolTip('DD@Electron')
  tray.setContextMenu(contextMenu)

  // Tray更新有bug, 亏我还写那么好看, 白写了
  // ;
  // (f => f((name, key, template) => stateEmitter.on(name, value => {
  //   contextMenu.items[key].label = template + value
  //   tray.setContextMenu(contextMenu)
  // })))
  // (apply => f => (name, key, template) => f(apply)(f, apply(name, key, template)))
  // (apply => f => (name, key, template) => f(apply)(f, apply(name, key, template)))
  // ('completeNumNow', 2, '已处理请求: ')
}
