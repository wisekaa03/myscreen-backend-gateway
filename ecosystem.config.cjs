module.exports = {
  apps: [
    {
      name: 'api',
      script: 'node ./dist/src/main.js',
      max_memory_restart: '700M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
