module.exports = {
  apps: [
    {
      name: 'api',
      script: './dist/src/main.js',
      max_memory_restart: '7000M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
