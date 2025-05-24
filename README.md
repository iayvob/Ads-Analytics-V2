# Social Media Analytics Platform

A production-ready Next.js application for comprehensive social media analytics with secure multi-platform authentication and real-time data visualization.

## 🚀 Features

- **Multi-Platform Integration**: Facebook Business, Instagram Business, Twitter/X
- **Real-Time Analytics**: Live data fetching with intelligent fallbacks
- **Secure Authentication**: JWT-based sessions with OAuth 2.0
- **Interactive Dashboard**: Responsive charts and metrics visualization
- **Enterprise Security**: Rate limiting, input validation, error boundaries
- **Production Ready**: Docker support, CI/CD pipeline, monitoring

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: MongoDB with Prisma ORM
- **Authentication**: Custom JWT + OAuth 2.0
- **UI**: shadcn/ui + Tailwind CSS
- **Charts**: Recharts
- **Validation**: Zod schemas
- **Deployment**: Vercel/Docker

## 📋 Quick Start

1. **Clone and Install**
   \`\`\`bash
   git clone <repository-url>
   cd social-auth-app
   npm install
   \`\`\`

2. **Environment Setup**
   \`\`\`bash
   cp .env.example .env.local
   # Configure your environment variables
   \`\`\`

3. **Database Setup**
   \`\`\`bash
   npx prisma generate
   npx prisma db push
   \`\`\`

4. **Development**
   \`\`\`bash
   npm run dev
   \`\`\`

## 🔧 Environment Variables

\`\`\`env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_SECRET=your-super-secret-session-key

# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/social-auth-db"

# Social Media APIs
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
\`\`\`

## 🏗️ Architecture

\`\`\`
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── page.tsx          # Landing page
├── components/            # React components
│   ├── dashboard/         # Dashboard components
│   └── ui/               # UI components
├── lib/                   # Core libraries
│   ├── api-clients/      # Platform API clients
│   ├── dashboard-service.ts # Data aggregation
│   ├── session.ts        # Session management
│   └── user-service.ts   # User operations
├── hooks/                 # Custom React hooks
└── prisma/               # Database schema
\`\`\`

## 🔐 Security Features

- **JWT Session Management**: Secure, httpOnly cookies
- **OAuth 2.0 Implementation**: PKCE for Twitter, state validation
- **Rate Limiting**: 100 requests per 15 minutes
- **Input Validation**: Zod schemas for all inputs
- **Error Boundaries**: Graceful error handling
- **Security Headers**: OWASP recommended headers

## 📊 Dashboard Features

### Overview Analytics
- Cross-platform metrics aggregation
- Real-time engagement tracking
- Audience demographics
- Growth trend analysis

### Platform-Specific Insights
- **Facebook**: Page metrics, ad performance, post analytics
- **Instagram**: Profile insights, media performance, story analytics
- **Twitter**: Tweet analytics, engagement metrics, follower insights

## 🚀 Deployment

### Vercel (Recommended)
\`\`\`bash
npm i -g vercel
vercel
\`\`\`

### Docker
\`\`\`bash
docker build -t social-auth-app .
docker run -p 3000:3000 social-auth-app
\`\`\`

## 🧪 Development

\`\`\`bash
# Type checking
npm run type-check

# Linting
npm run lint

# Database operations
npm run db:generate
npm run db:push
npm run db:studio
\`\`\`

## 📈 Performance

- **Server-Side Rendering**: Fast initial loads
- **Parallel API Calls**: Efficient data fetching
- **Intelligent Fallbacks**: Mock data when APIs fail
- **Optimized Queries**: Proper database indexing
- **Code Splitting**: Automatic route-based splitting

## 🔧 Configuration

### Rate Limiting
\`\`\`typescript
export const APP_CONFIG = {
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
}
\`\`\`

### Session Management
\`\`\`typescript
export const APP_CONFIG = {
  SESSION_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes
}
\`\`\`

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection**
   - Verify MongoDB connection string
   - Check network access and firewall settings

2. **OAuth Errors**
   - Verify app credentials are correct
   - Check redirect URIs match exactly

3. **API Rate Limits**
   - Monitor API usage in logs
   - Implement exponential backoff if needed

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/{provider}/login` - Initiate OAuth
- `GET /api/auth/{provider}/callback` - Handle callback
- `POST /api/auth/{provider}/logout` - Revoke access
- `GET /api/auth/status` - Check status

### Dashboard Endpoints
- `GET /api/dashboard/data` - Fetch all data
- `GET /api/dashboard/{platform}` - Platform-specific data

## 📄 License

MIT License - see LICENSE file for details.

---

**Production Status**: ✅ Ready for deployment
**Security**: ✅ Enterprise-grade
**Performance**: ✅ Optimized
**Documentation**: ✅ Complete
