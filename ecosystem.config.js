// PM2 Ecosystem Config — run from the repo root (Seller/)
// Usage:
//   pm2 start ecosystem.config.js
//   pm2 save
//   pm2 startup   (optional: auto-start on reboot)

module.exports = {
  apps: [
    // ── 1. Express Backend ────────────────────────────────────────────────
    {
      name: "veggiemap-backend",
      cwd: "./Backend",
      script: "server.js",
      interpreter: "node",
      instances: 1,              // Single instance (Socket.io needs sticky sessions for multi)
      exec_mode: "fork",
      watch: false,              // Don't watch in production
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      error_file: "./logs/backend-error.log",
      out_file: "./logs/backend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      restart_delay: 3000,
      max_restarts: 10,
    },

    // ── 2. Next.js Frontend ───────────────────────────────────────────────
    {
      name: "veggiemap-frontend",
      cwd: "./client",
      script: "node_modules/.bin/next",
      args: "start",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        // Override env vars here if not using .env.production file
        NEXT_PUBLIC_API_URL: "https://veggiemap.codewithvin.app/api",
        NEXT_PUBLIC_BACKEND_URL: "https://veggiemap.codewithvin.app",
        NEXT_PUBLIC_SOCKET_URL: "https://veggiemap.codewithvin.app",
        NEXT_PUBLIC_ADMIN_PATH: "secret-admin-a7f3k2",
      },
      error_file: "./logs/frontend-error.log",
      out_file: "./logs/frontend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
