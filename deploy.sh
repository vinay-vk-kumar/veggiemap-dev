#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
#  VeggieMap — EC2 Deployment Script
#  Domain: https://veggiemap.codewithvin.app
#
#  Run this script ON YOUR EC2 INSTANCE (Ubuntu 22.04 recommended)
#  After cloning the repo to /home/ubuntu/veggiemap (or similar path)
# ══════════════════════════════════════════════════════════════════════════════

set -e  # Exit on any error

REPO_DIR="/home/ubuntu/veggiemap-dev"   # ← change this to your actual clone path
DOMAIN="veggiemap.codewithvin.app"

echo "──────────────────────────────────────────"
echo " VeggieMap Deployment"
echo " Domain: $DOMAIN"
echo "──────────────────────────────────────────"

# ── STEP 1: System dependencies ───────────────────────────────────────────────
echo "[1/8] Installing system dependencies..."
sudo apt-get update -y
sudo apt-get install -y nginx certbot python3-certbot-nginx curl

# Install Node.js 20 (if not installed)
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally
if ! command -v pm2 &>/dev/null; then
    sudo npm install -g pm2
fi

# ── STEP 2: Install dependencies ──────────────────────────────────────────────
echo "[2/8] Installing Backend dependencies..."
cd "$REPO_DIR/Backend"
npm install --omit=dev

echo "[3/8] Installing Frontend dependencies..."
cd "$REPO_DIR/client"
npm install

# ── STEP 3: Build Next.js ─────────────────────────────────────────────────────
echo "[4/8] Building Next.js frontend..."
# .env.production is already committed and has the correct prod URLs
cd "$REPO_DIR/client"
npm run build

# ── STEP 4: Set up Nginx ──────────────────────────────────────────────────────
echo "[5/8] Configuring Nginx..."
sudo cp "$REPO_DIR/veggiemap.conf" /etc/nginx/sites-available/veggiemap
sudo ln -sf /etc/nginx/sites-available/veggiemap /etc/nginx/sites-enabled/

# Remove the default Nginx site if it exists to avoid conflicts
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t    # Test config
sudo systemctl reload nginx

# ── STEP 5: SSL Certificate (Let's Encrypt) ───────────────────────────────────
echo "[6/8] Obtaining SSL certificate..."
sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m admin@veggiemap.com
# After certbot runs, it automatically fills in the ssl_certificate lines in veggiemap.conf

# ── STEP 6: Start PM2 ─────────────────────────────────────────────────────────
echo "[7/8] Starting apps with PM2..."
cd "$REPO_DIR"
pm2 start ecosystem.config.js

# Save process list and configure auto-restart on reboot
pm2 save
pm2 startup   # Follow the printed command to enable auto-start

# ── STEP 7: Verify ────────────────────────────────────────────────────────────
echo "[8/8] Verifying..."
pm2 status
sudo systemctl status nginx --no-pager

echo ""
echo "✅ Deployment complete!"
echo ""
echo "  App:         https://$DOMAIN"
echo "  API health:  https://$DOMAIN/api/"
echo "  Admin panel: https://$DOMAIN/secret-admin-a7f3k2"
echo ""
echo "  PM2 logs:    pm2 logs"
echo "  PM2 status:  pm2 status"
echo "  Nginx logs:  sudo tail -f /var/log/nginx/error.log"
