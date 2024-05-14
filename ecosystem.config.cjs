module.exports = {
  apps: [
    {
      name: 'api',
      script: 'xvfb-run node ./dist/src/main.js',
      max_memory_restart: '1000M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
