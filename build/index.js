const fs = require('fs').promises
const { join } = require('path')
const got = require('got')
const { version } = require('../package.json')
const { GitProcess } = require('dugite')
const builder = require('electron-builder')
const Platform = builder.Platform

const notarize = require('./notarize')

GitProcess.exec(['log', '-1', '--format="%s"'], process.cwd()).then(async ({ stdout }) => {
  const { body: vue } = await got('https://cdn.jsdelivr.net/npm/vue@2')
  await fs.writeFile('vue/vue.js', vue)

  const subject = stdout.replace(/"/g, '').replace(/\n/g, '')
  const publish = version === subject
  console.log('publish', publish)

  await builder.build({
    targets: Platform.current().createTarget(),
    config: {
      appId: 'center.dd.DDatElectron',
      afterSign: publish ? notarize : undefined,
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
  const { body: vueDev } = await got('https://cdn.jsdelivr.net/npm/vue@2/dist/vue.js')
  await fs.writeFile('vue/vue.js', vueDev)
  console.log('done')
})
