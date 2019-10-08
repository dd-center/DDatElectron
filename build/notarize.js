const { notarize } = require('electron-notarize')

exports.default = ({ electronPlatformName, appOutDir, packager }) => {
  if (electronPlatformName !== 'darwin') {
    return
  }
  if (!process.env.CI) {
    return
  }

  const appName = packager.appInfo.productFilename

  return notarize({
    appBundleId: 'center.dd.DDatElectron',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS
  })
}
