const got = require('got')
const { writeFile } = require('fs').promises
const { join } = require('path')

const download = url => got(url).buffer()
const downloadJSON = url => got(url).json()

downloadJSON('https://api.github.com/repos/dd-center/ddatelectron/releases')
  .then(async ([{ assets }]) => {
    await assets
      .map(({ name, browser_download_url: url }) => ({ name, url }))
      .reduce(async (p, { url, name }) => {
        const path = join('ddc/ddatelectron', name)
        await p
        console.log('downloading', name)
        const file = await download(url)
        await writeFile(path, file)
        console.log('Saved', name)
      }, Promise.resolve(233))
  })
  .then(() => console.log('done'))
