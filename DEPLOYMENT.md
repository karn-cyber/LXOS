# LX Management Platform - Deployment Guide

## 🚀 Production Deployment

This guide covers deploying the LX Management Platform to production using Vercel (recommended) or other hosting platforms.

---

## Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (or MongoDB server)
- Git repository
- Vercel account (for Vercel deployment)

---

## Option 1: Deploy to Vercel (Recommended)

### 1. Prepare Your Repository

```bash
# Ensure all changes are committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect Next.js

### 3. Configure Environment Variables

In Vercel dashboard, add these environment variables:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lx-management-os

# Authentication
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-super-secret-key-min-32-chars
AUTH_SECRET=your-super-secret-key-min-32-chars

# Environment
NODE_ENV=production
```

**Generate secrets:**
```bash
# Generate a random secret
openssl rand -base64 32
```

### 4. Deploy

Click "Deploy" and Vercel will:
- Install dependencies
- Build the application
- Deploy to production

Your app will be live at `https://your-project.vercel.app`

---

## Option 2: Deploy to Custom Server

### 1. Build the Application

```bash
npm run build
```

### 2. Set Environment Variables

Create `.env.production`:

```env
MONGODB_URI=mongodb://your-mongo-server:27017/lx-management-os
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secret-key
AUTH_SECRET=your-super-secret-key
NODE_ENV=production
```

### 3. Start Production Server

```bash
npm start
```

Or use PM2 for process management:

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "lx-management" -- start

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
```

---

## MongoDB Atlas Setup

### 1. Create Cluster

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Choose your region (closest to your users)

### 2. Configure Network Access

1. Go to "Network Access"
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add specific IPs for better security

### 3. Create Database User

1. Go to "Database Access"
2. Click "Add New Database User"
3. Create username and password
4. Grant "Read and write to any database" role

### 4. Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with `lx-management-os`

---

## Initial Data Setup

### Seed Production Database

```bash
# Connect to production database
MONGODB_URI=your-production-uri node scripts/seed.js
```

**Important:** Change default passwords after seeding!

---

## Post-Deployment Checklist

### Security

- [ ] Change all default passwords
- [ ] Use strong `AUTH_SECRET` (32+ characters)
- [ ] Enable MongoDB authentication
- [ ] Restrict MongoDB network access
- [ ] Use HTTPS (Vercel provides this automatically)
- [ ] Review and update CORS settings if needed

### Performance

- [ ] Enable caching where appropriate
- [ ] Optimize images (use Next.js Image component)
- [ ] Monitor database query performance
- [ ] Set up CDN for static assets (Vercel does this)

### Monitoring

- [ ] Set up error tracking (e.g., Sentry)
- [ ] Monitor database performance
- [ ] Set up uptime monitoring
- [ ] Configure logging

### Backup

- [ ] Enable MongoDB Atlas automated backups
- [ ] Set up regular database exports
- [ ] Document recovery procedures

---

## Environment-Specific Configuration

### Development
```env
MONGODB_URI=mongodb://localhost:27017/lx-management-os
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

### Staging
```env
MONGODB_URI=mongodb+srv://...staging-cluster.../lx-staging
NEXTAUTH_URL=https://staging.your-domain.com
NODE_ENV=production
```

### Production
```env
MONGODB_URI=mongodb+srv://...production-cluster.../lx-management-os
NEXTAUTH_URL=https://your-domain.com
NODE_ENV=production
```

---

## Custom Domain Setup (Vercel)

1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Vercel will automatically provision SSL certificate

---

## Troubleshooting

### Build Fails

**Error:** "Module not found"
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Issues

**Error:** "MongoServerError: Authentication failed"
- Verify username and password in connection string
- Check database user permissions
- Ensure IP is whitelisted in MongoDB Atlas

### Authentication Issues

**Error:** "Invalid credentials"
- Verify `AUTH_SECRET` is set correctly
- Check `NEXTAUTH_URL` matches your domain
- Clear browser cookies and try again

### Performance Issues

- Check MongoDB Atlas metrics
- Review slow queries in MongoDB logs
- Enable Next.js analytics in Vercel
- Optimize database indexes

---

## Scaling Considerations

### Database

- **Free Tier**: Good for testing (512MB storage)
- **M10**: Recommended for production (10GB storage, 2GB RAM)
- **M20+**: For high traffic (20GB+ storage, 4GB+ RAM)

### Application

Vercel automatically scales:
- Serverless functions scale automatically
- Edge network for global performance
- No server management required

---

## Maintenance

### Regular Tasks

**Weekly:**
- Review error logs
- Check database performance
- Monitor disk usage

**Monthly:**
- Update dependencies
- Review security advisories
- Backup verification

**Quarterly:**
- Performance audit
- Security audit
- User feedback review

---

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Review MongoDB Atlas logs
3. Check application error logs
4. Contact support if needed

---

## Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)

---

**Deployment Checklist:**
- ✅ Environment variables configured
- ✅ Database seeded
- ✅ Default passwords changed
- ✅ SSL enabled
- ✅ Monitoring set up
- ✅ Backups configured
- ✅ Custom domain (optional)

Your LX Management Platform is now live! 🎉
