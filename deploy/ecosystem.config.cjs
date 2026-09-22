/** PM2 config — cwd is replaced by deploy/setup-vps.sh if needed */
const appRoot = process.env.LINGUA_APP_DIR || '/var/www/ai-language-api';

module.exports = {
  apps: [
    {
      name: 'lingua-ai-api',
      script: 'dist/server.js',
      cwd: `${appRoot}/api`,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production',
        PORT: 3017,
        HOST: '0.0.0.0',
      },
    },
  ],
};
