# EvolveFit - Production Deployment Guide

## Overview
This guide covers the complete setup, testing, and deployment of the EvolveFit fitness AI platform for production environments.

## System Requirements
- Node.js 18+
- PostgreSQL 13+
- Redis (for real-time features)
- Supabase account (for database hosting)
- Gemini API key
- 2GB RAM minimum

## Pre-Deployment Checklist

### 1. Environment Configuration
\`\`\`bash
# .env.production
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
GEMINI_API_KEY=your_gemini_key
DATABASE_URL=your_database_url
REDIS_URL=your_redis_url
\`\`\`

### 2. Database Setup
- Run migration: `scripts/02-production-database-setup.sql`
- Enable Row Level Security (RLS) on all tables
- Create indexes for frequently queried columns
- Set up automated backups (daily)

### 3. Testing
Run the production test suite:
\`\`\`typescript
import { productionTestSuite } from '@/lib/testing-suite'

const results = await productionTestSuite.runFullTestSuite()
console.log(productionTestSuite.getReport())
\`\`\`

### 4. Performance Optimization
- Enable caching: `Cache-Control: public, max-age=3600`
- Implement image optimization with Next.js Image component
- Use code splitting for large components
- Enable compression on API responses

## Features Status

### Community System ✅
- Real-time messaging with WebSocket support
- Multi-user simultaneous access
- Message persistence in database
- User isolation with RLS policies

### Contest Module ✅
- Challenge creation and management
- One-time acceptance per user
- Points system starting from 0
- Leaderboard with rankings
- Real-time submission verification

### Admin Dashboard ✅
- Real-time system monitoring
- Live user management
- Content moderation tools
- Contest administration
- Performance metrics

### AI Verification ✅
- Gemini API integration for content analysis
- Secure server-side API endpoints
- Content authenticity verification
- Community guidelines compliance

### YouTube Integration ✅
- Video link verification system
- 50+ verified exercise videos
- Embed player with error handling
- Broken link detection

## Multi-Device Support

All features support seamless real-time synchronization across devices:
- Community posts sync in real-time
- Contest updates broadcast to all clients
- Admin actions reflect immediately
- Leaderboard updates in <1 second

## Security Considerations

1. **Authentication**
   - Use Supabase Auth for user management
   - JWT tokens with 1-hour expiration
   - Refresh tokens stored securely

2. **Data Protection**
   - Row Level Security (RLS) enabled
   - Encrypted sensitive data fields
   - Regular security audits

3. **API Security**
   - CORS properly configured
   - Rate limiting on endpoints
   - Input validation on all routes

4. **Gemini API**
   - API key stored server-side only
   - Never exposed to client
   - Request signing for verification

## Deployment Steps

1. **Build**
   \`\`\`bash
   npm run build
   \`\`\`

2. **Test**
   \`\`\`bash
   npm run test:production
   \`\`\`

3. **Deploy to Vercel**
   \`\`\`bash
   vercel deploy --prod
   \`\`\`

4. **Verify**
   - Check dashboard at /admin
   - Create test contest
   - Verify real-time updates
   - Check Gemini API connectivity

## Monitoring

### Key Metrics
- API response time < 200ms
- Database query time < 100ms
- Real-time message latency < 500ms
- Memory usage < 500MB
- CPU usage < 30%

### Logging
- All API errors logged to Sentry
- Database queries logged (slow query threshold: 1s)
- Admin actions logged for audit trail

## Maintenance

### Daily
- Monitor system load
- Check error logs
- Verify real-time connectivity

### Weekly
- Database optimization
- Review admin action logs
- Check performance metrics

### Monthly
- Security audit
- Backup verification
- Performance analysis

## Troubleshooting

### Real-time Messages Not Syncing
1. Check WebSocket connection
2. Verify Supabase Realtime is enabled
3. Check client subscription setup

### Gemini API Errors
1. Verify API key is valid
2. Check quota limits
3. Review error logs at `/api/ai/*`

### Database Issues
1. Check connection string
2. Verify RLS policies
3. Review slow queries

## Support

For issues or questions:
- Check error logs in Sentry
- Review admin dashboard metrics
- Contact support team

---
Last Updated: 2026-01-17
Version: 1.0.0
