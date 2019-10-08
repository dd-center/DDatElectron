const builder = require('electron-builder')
const Platform = builder.Platform

builder.build({
  targets: Platform.current().createTarget(),
  config: {
    appId: 'center.dd.DDatHome',
    mac: {
      category: 'public.app-category.utilities'
    }
  }
}).then(() => {
  console.log('done')
}).catch(console.error)
