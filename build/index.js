const builder = require('electron-builder')
const Platform = builder.Platform

builder.build({
  targets: Platform.current().createTarget(),
  config: {
    appId: 'center.dd.DDatElectron',
    mac: {
      category: 'public.app-category.utilities'
    }
  },
  publish: 'always'
}).then(() => {
  console.log('done')
}).catch(console.error)
