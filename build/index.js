const { join } = require('path')
const { version } = require('../package.json')
const got = require('got')
const builder = require('electron-builder')
const Platform = builder.Platform

got('https://api.github.com/repos/dd-center/DDatElectron/releases/latest', { json: 'true' }).then(({ body: { name } }) => {
  const publish = version !== name
  console.log('publish', publish)
  builder.build({
    targets: Platform.current().createTarget(),
    config: {
      appId: 'center.dd.DDatElectron',
      afterSign: publish ? join(__dirname, 'notarize.js') : undefined,
      mac: {
        target: ['dmg'],
        category: 'public.app-category.utilities',
        entitlements: join(__dirname, 'entitlements.mac.plist'),
        entitlementsInherit: join(__dirname, 'entitlements.mac.plist'),
        hardenedRuntime: true,
        gatekeeperAssess: false
      },
      publish: {
        provider: 'github',
        releaseType: publish ? 'release' : 'draft'
      }
    },
    publish: publish ? 'always' : 'never'
  }).then(() => {
    console.log('done')
  }).catch(console.error)
})
