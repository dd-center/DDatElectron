const { join } = require('path')
const builder = require('electron-builder')
const Platform = builder.Platform

builder.build({
  targets: Platform.current().createTarget(),
  config: {
    appId: 'center.dd.DDatElectron',
    afterSign: join(__dirname, 'notarize.js'),
    mac: {
      target: ['dmg'],
      category: 'public.app-category.utilities',
      entitlements: join(__dirname, 'entitlements.mac.plist'),
      entitlementsInherit: join(__dirname, 'entitlements.mac.plist'),
      hardenedRuntime: true,
      gatekeeperAssess: false
    }
  },
  publish: process.env.CI ? 'always' : 'never'
}).then(() => {
  console.log('done')
}).catch(console.error)
