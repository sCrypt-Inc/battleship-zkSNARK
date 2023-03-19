const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const path = require('path')

module.exports = function override(config, env) {

  config.resolve.fallback = {
    fs: false,
    os: false,
    path: false,
    module: false
  }

  const scopePluginIndex = config.resolve.plugins.findIndex(
    ({ constructor }) => constructor && constructor.name === 'ModuleScopePlugin'
  );

  config.resolve.plugins.splice(scopePluginIndex, 1);

  config.plugins.push(new NodePolyfillPlugin({
    excludeAliases: ['console']
  }))

  config.experiments = {
    asyncWebAssembly: true,
    syncWebAssembly: true
  }

  config.module.rules.push({
    test: /\.wasm$/,
    type: 'webassembly/sync',
  })

  return config
}