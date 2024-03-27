/* eslint global-require:0, @typescript-eslint/no-var-requires:0, no-console:0 */
const nodeExternals = require('webpack-node-externals');

module.exports = (options) => {
  const mode = process.env.NODE_ENV ?? options.mode;
  console.log(`--- Webpack <${mode}> build ---`);

  const externals = nodeExternals({
    allowlist: ['webpack/hot/poll?100', /pino-pretty/],
  });

  const config = {
    ...options,
    mode,
    externals: [externals],
  };

  return config;
};
