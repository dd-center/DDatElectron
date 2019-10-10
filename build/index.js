const { join } = require('path')
const { version } = require('../package.json')
const git = require('git-last-commit')
const builder = require('electron-builder')
const Platform = builder.Platform

git.getLastCommit((_err, commit) => {
  const publish = version === commit.subject
  console.log('publish', publish)
  builder.build({
    targets: Platform.current().createTarget(),
    config: {
      appId: 'center.dd.DDatElectron',
      afterSign: publish ? join(__dirname, 'notarize.js') : undefined,
      mac: {
        target: ['dmg', 'zip'],
        category: 'public.app-category.utilities',
        entitlements: join(__dirname, 'entitlements.mac.plist'),
        entitlementsInherit: join(__dirname, 'entitlements.mac.plist'),
        hardenedRuntime: true,
        gatekeeperAssess: false
      },
      win: {
        target: ['portable', 'nsis']
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
