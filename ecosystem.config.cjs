module.exports = {
  apps: [
    {
      name: 'api-gateway',
      script: 'node ./dist/src/main.js',
      max_memory_restart: '700M',
      error_file: '/var/log/pm2/api-gateway/error.log',
      out_file: '/var/log/pm2/api-gateway/out.log',
      time: true,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
