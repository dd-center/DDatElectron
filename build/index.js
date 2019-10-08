const { join } = require('path')
const { version } = require('../package.json')
const got = require('got')
const builder = require('electron-builder')
const Platform = builder.Platform

got('https://api.github.com/repos/dd-center/DDatElectron/releases/latest', { json: 'true' }).then(({ body: { name } }) => {
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
    publish: {
      provider: 'github',
      publish: 'always',
      releaseType: version !== name ? 'release' : 'draft'
    }
  }).then(() => {
    console.log('done')
  }).catch(console.error)
})
