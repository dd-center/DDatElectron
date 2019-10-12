const { autoUpdater } = require('electron-updater')
autoUpdater.logger = console
autoUpdater.setFeedURL('https://dd.center/api/update/ddatelectron/')

module.exports = ({ state }) => {
  autoUpdater.checkForUpdates()

  autoUpdater.on('update-available', ({ version }) => {
    state.update = version
  })
  autoUpdater.on('update-not-available', () => {
    state.update = false
  })
  autoUpdater.on('download-progress', progress => {
    state.updateProgress = progress
  })
  autoUpdater.on('update-downloaded', () => {
    state.updateDownloaded = true
  })

  setInterval(() => {
    autoUpdater.checkForUpdates()
  }, 1000 * 60 * 60)
  return autoUpdater
}
