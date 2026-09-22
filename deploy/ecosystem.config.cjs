/** PM2 cluster config for production load handling */
const appRoot = process.env.LINGUA_APP_DIR || '/var/www/ai-language-api';
const instances = Number(process.env.PM2_INSTANCES || 2);

module.exports = {
  apps: [
    {
      name: 'lingua-ai-api',
      script: 'dist/server.js',
      cwd: `${appRoot}/api`,
      instances: Number.isFinite(instances) && instances > 0 ? instances : 2,
      exec_mode: 'cluster',
      autorestart: true,
      max_restarts: 10,
      listen_timeout: 10_000,
      kill_timeout: 10_000,
      env: {
        NODE_ENV: 'production',
        PORT: 3019,
        HOST: '0.0.0.0',
      },
    },
  ],
};
