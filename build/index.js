const fs = require('fs').promises
const { join } = require('path')
const got = require('got')
const { version } = require('../package.json')
const git = require('git-last-commit')
const builder = require('electron-builder')
const Platform = builder.Platform

git.getLastCommit(async (_err, commit) => {
  const { body: vue } = await got('https://vuejs.org/js/vue.min.js')
  await fs.writeFile('vue/vue.js', vue)
  const publish = version === commit.subject
  console.log('publish', publish)
  await builder.build({
    targets: Platform.current().createTarget(),
    config: {
      appId: 'center.dd.DDatElectron',
      afterSign: publish ? join(__dirname, 'notarize.js') : undefined,
      mac: {
        extendInfo: {
          LSUIElement: 1
        },
        target: ['dmg', 'zip'],
        category: 'public.app-category.utilities',
        entitlements: join(__dirname, 'entitlements.mac.plist'),
        entitlementsInherit: join(__dirname, 'entitlements.mac.plist'),
        hardenedRuntime: true,
        gatekeeperAssess: false
      },
      win: {
        target: ['portable', 'nsis'],
        verifyUpdateCodeSignature: false
      },
      publish: {
        provider: 'github',
        releaseType: publish ? 'release' : 'draft'
      }
    },
    publish: publish ? 'always' : 'never'
  }).catch(console.error)
  const { body: vueDev } = await got('https://vuejs.org/js/vue.js')
  await fs.writeFile('vue/vue.js', vueDev)
  console.log('done')
})
