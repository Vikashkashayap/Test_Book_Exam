# Deployment Guide

## Prerequisites

- Node.js 20+
- MongoDB Atlas or self-hosted MongoDB 6+
- Razorpay account (test/live keys)
- Google Cloud OAuth credentials
- Cloudinary account
- OpenAI API key (optional, for AI)
- SMTP credentials (optional, for email)

---

## 1. MongoDB (Atlas recommended)

1. Create cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Whitelist IP `0.0.0.0/0` for dev (restrict in production)
3. Copy connection string → `MONGODB_URI`

---

## 2. Backend — AWS EC2

### Provision EC2

- AMI: Ubuntu 22.04 LTS
- Instance: t3.small minimum (t3.medium for production)
- Security Group: inbound 22 (SSH), 80, 443, 5000 (or only 80/443 behind nginx)

### Server setup

```bash
# SSH into instance
sudo apt update && sudo apt install -y nodejs npm nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Clone repo
git clone <your-repo-url> exam-prep && cd exam-prep
npm install
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with production values

npm run build --workspace=@exam-prep/api
```

### Environment (`apps/api/.env`)

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_ACCESS_SECRET=<64-char-random>
JWT_REFRESH_SECRET=<64-char-random>
FRONTEND_URL=https://your-app.vercel.app
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
OPENAI_API_KEY=sk-...
```

### Process manager (PM2)

```bash
npm install -g pm2
cd apps/api
pm2 start dist/server.js --name exam-prep-api
pm2 save
pm2 startup
```

### Nginx reverse proxy

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo certbot --nginx -d api.yourdomain.com
```

### Seed production data

```bash
npm run seed --workspace=@exam-prep/api
```

---

## 3. Frontend — Vercel

1. Import GitHub repo in [vercel.com](https://vercel.com)
2. Set **Root Directory** to `apps/web`
3. Framework Preset: **Next.js**

### Environment variables

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com` |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay public key |

4. Deploy → production URL

### CORS

Ensure `FRONTEND_URL` in API `.env` matches Vercel domain exactly.

---

## 4. Razorpay Webhooks

1. Dashboard → Webhooks → Add `https://api.yourdomain.com/api/v1/payments/webhook`
2. Set `RAZORPAY_WEBHOOK_SECRET` in API env
3. Extend `payment.controller.webhook` for `payment.captured` events

---

## 5. Google OAuth

1. Google Cloud Console → APIs → Credentials → OAuth 2.0 Client
2. Authorized JavaScript origins: `https://your-app.vercel.app`
3. Add Google Sign-In button on login page using `@react-oauth/google`

---

## 6. Cloudinary

1. Upload folder: `exam-prep/`
2. Use admin upload endpoints with Multer → `cloudinary.service.uploadFile`

---

## 7. CI/CD (GitHub Actions example)

```yaml
name: Deploy API
on:
  push:
    branches: [main]
    paths: ['apps/api/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build --workspace=@exam-prep/api
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd exam-prep && git pull && npm ci
            npm run build --workspace=@exam-prep/api
            pm2 restart exam-prep-api
```

---

## 8. Health checks

- API: `GET https://api.yourdomain.com/api/v1/health`
- Monitor with UptimeRobot or AWS CloudWatch

---

## 9. Production checklist

- [ ] Strong JWT secrets (32+ chars)
- [ ] MongoDB backups enabled
- [ ] HTTPS everywhere
- [ ] Rate limits tuned
- [ ] Razorpay live keys
- [ ] Error logging (Sentry)
- [ ] PM2 cluster mode for multi-core
- [ ] Redis for sessions (recommended at scale)
