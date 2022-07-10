const { shareAll, share, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');
// file_name should be lowercase and if it more then one word put '_' between them,
const addonConfig = require('../addon.config.json');
const filename = `file_${addonConfig.AddonUUID.replace(/-/g, '_').toLowerCase()}`;

const webpackConfig = withModuleFederationPlugin({
    name: filename,
    filename: `${filename}.js`,
    exposes: {
        './AssetsModule': './src/app/addon/index.ts'
    },
    shared: {
        ...shareAll({ strictVersion: true, requiredVersion: 'auto' }),
    }
});

module.exports = {
    ...webpackConfig,
    output: {
        ...webpackConfig.output,
        uniqueName: filename,
    },
};