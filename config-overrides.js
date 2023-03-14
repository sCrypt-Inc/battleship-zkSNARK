const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const path = require('path')

module.exports = function override(config, env) {

  config.resolve.fallback = {
    fs: false,
    os: false,
    path: false,
    module: false
  }

  config.plugins.push(new NodePolyfillPlugin({
    excludeAliases: ['console']
  }))

  const wasmExtensionRegExp = /\.wasm$/
  config.resolve.extensions.push('.wasm')
  config.module.rules.forEach(rule => {
    (rule.oneOf || []).forEach(oneOf => {
      if (oneOf.loader && oneOf.loader.indexOf('file-loader') >= 0) {
        oneOf.exclude.push(wasmExtensionRegExp)
      }
    })
  })

  config.module.rules.push({
    test: wasmExtensionRegExp,
    include: path.resolve(__dirname, 'src'),
    use: [{ loader: require.resolve('wasm-loader'), options: {} }]
  })

  config.module.rules.push({
    test: /\.mjs$/,
    include: /node_modules/,
    type: 'javascript/auto'
  })

  return config
}