# LeaveFlow - WhatsApp-Native Leave Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Node.js 18+](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.33-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791.svg)](https://www.postgresql.org/)

LeaveFlow is a comprehensive leave management system that integrates seamlessly with WhatsApp, providing employees with a natural, conversational interface for requesting, tracking, and managing leave. The system combines modern web technologies with AI-powered natural language processing to create an intuitive leave management experience.

## 🌟 Key Features

### Core Functionality
- **WhatsApp Integration**: Native WhatsApp interface for leave requests and approvals
- **AI-Powered Processing**: Intelligent parsing of natural language leave requests
- **Real-time Notifications**: Instant updates via WhatsApp for request status changes
- **Multi-role Support**: Separate interfaces for employees, managers, and administrators
- **Leave Calendar**: Visual calendar view for planning and tracking
- **Automated Approvals**: Configurable approval workflows with escalation
- **Holiday Management**: Centralized holiday calendar with regional support
- **Comprehensive Reporting**: Detailed analytics and leave usage reports

### Advanced Features
- **Smart Scheduling**: Intelligent conflict detection and scheduling suggestions
- **Document Attachments**: Support for leave documentation and medical certificates
- **Bulk Operations**: Mass approval/rejection capabilities for administrators
- **Audit Trail**: Complete logging of all leave-related activities
- **Mobile-First Design**: Responsive design optimized for mobile devices
- **Offline Capability**: Progressive Web App (PWA) features for offline access

## 🏗️ Architecture & Tech Stack

### Why This Tech Stack?

#### Backend: FastAPI + Python
**Why FastAPI?**
- **Performance**: Built on Starlette/ASGI, provides exceptional performance comparable to Node.js and Go
- **Type Safety**: Native Python type hints with automatic API documentation generation
- **Async Support**: First-class async/await support for handling concurrent WhatsApp webhooks
- **Auto Documentation**: Swagger/OpenAPI documentation generated automatically
- **Modern Python**: Leverages Python 3.11+ features like structural pattern matching
- **Serverless Ready**: Perfect for Vercel deployment with minimal cold start times

**Why Python?**
- **Rich Ecosystem**: Extensive libraries for AI/ML, data processing, and integrations
- **Developer Productivity**: Clean, readable syntax reduces development time
- **AI Integration**: Seamless integration with OpenRouter and other AI services
- **Scientific Computing**: Strong support for date/time calculations and scheduling logic

#### Database: PostgreSQL + SQLAlchemy 2.0
**Why PostgreSQL?**
- **ACID Compliance**: Ensures data integrity for financial/HR systems
- **JSON Support**: Native JSONB for flexible metadata storage
- **Advanced Features**: Window functions, CTEs, and advanced indexing
- **Cloud Native**: Excellent support on platforms like Neon and Supabase
- **Performance**: Superior performance for complex queries and aggregations

**Why SQLAlchemy 2.0?**
- **Modern ORM**: Complete rewrite with improved performance and async support
- **Type Safety**: Enhanced typing support with Python 3.11+
- **Migration Support**: Alembic integration for seamless schema evolution
- **Flexibility**: Supports both ORM and raw SQL approaches

#### Frontend: Next.js 14 + React 18 + TypeScript
**Why Next.js 14?**
- **App Router**: Modern file-based routing with nested layouts and loading states
- **Server Components**: Improved performance with server-side rendering
- **Edge Runtime**: Optimized for Vercel's edge network
- **Built-in Optimizations**: Automatic code splitting, image optimization, and bundling

**Why React 18?**
- **Concurrent Features**: Concurrent rendering for better user experience
- **Suspense**: Better loading states and error boundaries
- **Automatic Batching**: Improved performance with automatic state batching

**Why TypeScript?**
- **Type Safety**: Prevents runtime errors and improves developer experience
- **Better IDE Support**: Enhanced autocomplete and refactoring capabilities
- **Maintainability**: Self-documenting code with explicit type contracts

#### UI/UX: Tailwind CSS + Shadcn/ui + Radix UI
**Why Tailwind CSS?**
- **Utility-First**: Rapid development with consistent design system
- **Performance**: Minimal CSS bundle size with purging unused styles
- **Responsive Design**: Mobile-first responsive utilities
- **Customization**: Easy theme customization and dark mode support

**Why Shadcn/ui?**
- **Accessibility**: Built on Radix UI primitives for WCAG compliance
- **Consistency**: Pre-built components following design system principles
- **Customizable**: Easy to customize and extend components
- **Modern**: Uses modern React patterns and TypeScript

#### Integrations
**WhatsApp Cloud API**: Official Meta API for reliable, scalable messaging
**OpenRouter AI**: Access to multiple free LLM models for natural language processing
**JWT Authentication**: Stateless, secure authentication with refresh token support
**Vercel Deployment**: Serverless platform optimized for Next.js and FastAPI

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WhatsApp      │    │   Next.js       │    │   FastAPI       │
│   Mobile App    │◄──►│   Dashboard     │◄──►│   Backend API   │
│                 │    │   (React)       │    │   (Python)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ WhatsApp Cloud  │    │   Vercel        │    │   PostgreSQL    │
│ API             │    │   Hosting       │    │   Database      │
│                 │    │                 │    │   (Neon)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+**: Backend runtime
- **Node.js 18+**: Frontend build tools
- **PostgreSQL 14+**: Database (or Neon for cloud)
- **Git**: Version control

### Backend Setup

1. **Clone and navigate to backend directory:**
   ```bash
   git clone <repository-url>
   cd LeaveFlow/backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   Create a `.env` file in the backend directory:
   ```env
   # Database
   DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/leaveflow

   # JWT
   SECRET_KEY=your-secret-key-here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30

   # WhatsApp
   WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
   WHATSAPP_VERIFY_TOKEN=your-verify-token
   WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id

   # AI Service
   OPENROUTER_API_KEY=your-openrouter-api-key
   AI_MODEL=meta-llama/llama-2-70b-chat:free

   # CORS
   CORS_ORIGINS=http://localhost:3000,http://localhost:3001
   ```

5. **Run database migrations:**
   ```bash
   alembic upgrade head
   ```

6. **Start the development server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to dashboard directory:**
   ```bash
   cd ../dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXTAUTH_SECRET=your-nextauth-secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 📱 WhatsApp Integration Setup

### 1. Meta for Developers Setup

1. **Create a Meta Developer Account:**
   - Visit [developers.facebook.com](https://developers.facebook.com)
   - Create a new app or use existing Business app

2. **Add WhatsApp Product:**
   - In your app dashboard, click "Add Product"
   - Select "WhatsApp" and follow setup instructions

3. **Configure Webhook:**
   - Set webhook URL: `https://your-domain.com/api/webhook/whatsapp`
   - Verify token: Same as `WHATSAPP_VERIFY_TOKEN` in environment
   - Subscribe to messages and message_deliveries

### 2. Phone Number Configuration

1. **Add Phone Number:**
   - In WhatsApp settings, add your business phone number
   - Complete verification process

2. **Test Integration:**
   - Send a test message to your number
   - Verify webhook receives the message

### 3. AI Service Configuration

1. **OpenRouter Account:**
   - Sign up at [openrouter.ai](https://openrouter.ai)
   - Generate API key

2. **Model Selection:**
   - Use free models like `meta-llama/llama-2-70b-chat:free`
   - Configure in environment variables

## 🌐 Deployment

### Vercel Deployment

#### Backend Deployment

1. **Connect Repository:**
   - Import your GitHub repository to Vercel
   - Set root directory to `backend`

2. **Environment Variables:**
   - Add all environment variables from `.env` file
   - Use Vercel Postgres for database

3. **Build Settings:**
   - Build Command: `pip install -r requirements.txt`
   - Install Command: `pip install -r requirements.txt`
   - Output Directory: (leave empty)

#### Frontend Deployment

1. **Connect Repository:**
   - Import same repository to Vercel
   - Set root directory to `dashboard`

2. **Environment Variables:**
   - `NEXT_PUBLIC_API_URL`: Your backend Vercel URL
   - Other NextAuth and public variables

3. **Build Settings:**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Install Command: `npm install`

### Database Setup (Neon)

1. **Create Neon Account:**
   - Visit [neon.tech](https://neon.tech)
   - Create a new project

2. **Get Connection String:**
   - Copy the connection string from Neon dashboard
   - Update `DATABASE_URL` in environment variables

3. **Run Migrations:**
   - Use Vercel functions or local setup to run migrations

## 🧪 Testing

### Backend Testing

```bash
cd backend
pytest tests/ -v
```

### Frontend Testing

```bash
cd dashboard
npm test
```

### Integration Testing

```bash
# Test WhatsApp webhook
curl -X POST http://localhost:8000/api/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## ✅ Final Wrap-Up Checklist
- Log in as HR, Manager, and Admin; open `/requests` and the header bell to confirm pending requests are visible per role.
- Verify `NEXT_PUBLIC_API_URL` points to the correct backend for both local and production builds.
- Run backend tests (`pytest`) and frontend health checks (`npm run build`) before shipping.
- Seed or migrate the database (Alembic) and ensure demo accounts/roles are active for acceptance testing.
- Clear browser storage (localStorage) and re-login to ensure fresh tokens after deployment.

## 📊 Demo Credentials

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Admin | admin@leaveflow.com | admin123 | Full system access |
| Manager | manager@leaveflow.com | manager123 | Team management |
| Employee | employee@leaveflow.com | employee123 | Basic leave requests |

## 📁 Project Structure

```
LeaveFlow/
├── backend/                          # FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI application
│   │   ├── config.py                 # Configuration settings
│   │   ├── database.py               # Database connection
│   │   ├── models.py                 # SQLAlchemy models
│   │   ├── schemas.py                # Pydantic schemas
│   │   ├── scheduler.py              # Background tasks
│   │   ├── routes/                   # API endpoints
│   │   │   ├── auth.py
│   │   │   ├── leave.py
│   │   │   ├── users.py
│   │   │   ├── webhook.py
│   │   │   ├── holidays.py
│   │   │   └── account_requests.py
│   │   └── services/                 # Business logic
│   │       ├── ai_service.py
│   │       ├── leave.py
│   │       ├── parser.py
│   │       ├── validator.py
│   │       └── whatsapp.py
│   ├── api/
│   │   └── index.py                  # Vercel serverless function
│   ├── requirements.txt
│   └── vercel.json
├── dashboard/                        # Next.js Frontend
│   ├── app/                          # Next.js 14 App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── (components)/
│   │   ├── holidays/
│   │   ├── pending-accounts/
│   │   ├── profile/
│   │   ├── requests/
│   │   ├── signup/
│   │   └── users/
│   ├── components/                   # Reusable components
│   ├── lib/                          # Utilities and providers
│   ├── public/                       # Static assets
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── tsconfig.json
├── API_DOCUMENTATION.md              # API reference
├── TESTING_GUIDE.md                  # Testing procedures
├── TROUBLESHOOTING.md                # Common issues and solutions
├── ERROR_PREVENTION_SUMMARY.md       # Error handling guide
└── README.md                         # This file
```

## 🔧 Development Guidelines

### Code Style

#### Backend (Python)
- **Black**: Code formatting
- **isort**: Import sorting
- **flake8**: Linting
- **mypy**: Type checking

#### Frontend (TypeScript/React)
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking

### Git Workflow

1. **Branch Naming:**
   - `feature/feature-name`: New features
   - `bugfix/bug-description`: Bug fixes
   - `hotfix/critical-fix`: Critical fixes

2. **Commit Messages:**
   - Use conventional commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`

3. **Pull Requests:**
   - Descriptive title and detailed description
   - Link related issues
   - Request review from team members

### API Design Principles

- **RESTful**: Follow REST conventions
- **Versioning**: API versioning through URL paths
- **Documentation**: OpenAPI/Swagger documentation
- **Error Handling**: Consistent error response format
- **Pagination**: Cursor-based pagination for large datasets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 Documentation

- [API Documentation](API_DOCUMENTATION.md) - Complete API reference
- [Testing Guide](TESTING_GUIDE.md) - Testing procedures and best practices
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions
- [Error Prevention](ERROR_PREVENTION_SUMMARY.md) - Error handling strategies

## 📈 Performance Considerations

### Backend Optimization
- **Async Operations**: All I/O operations are asynchronous
- **Connection Pooling**: Database connection pooling with asyncpg
- **Caching**: Redis integration for session and data caching
- **Background Tasks**: AP Scheduler for non-blocking operations

### Frontend Optimization
- **Code Splitting**: Automatic code splitting with Next.js
- **Image Optimization**: Next.js Image component for optimized images
- **Static Generation**: ISR and SSG for better performance
- **PWA Features**: Service worker for offline capability

## 🔒 Security

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication with refresh tokens
- **Role-Based Access**: Granular permissions system
- **Password Security**: bcrypt hashing with salt rounds
- **Session Management**: Secure session handling

### Data Protection
- **Input Validation**: Pydantic models for request validation
- **SQL Injection Prevention**: SQLAlchemy ORM protection
- **XSS Protection**: React's built-in XSS protection
- **CSRF Protection**: Next.js CSRF protection

### WhatsApp Security
- **Webhook Verification**: Meta webhook signature verification
- **Rate Limiting**: Request rate limiting to prevent abuse
- **Data Encryption**: End-to-end encryption for sensitive data

## 🐛 Known Issues & Limitations

- WhatsApp Cloud API rate limits (250 requests per day for free tier)
- AI model response times may vary based on OpenRouter load
- Mobile browser compatibility for PWA features
- Timezone handling for international deployments

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
- Review [API Documentation](API_DOCUMENTATION.md)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Meta**: WhatsApp Cloud API
- **OpenRouter**: AI model access
- **Vercel**: Hosting platform
- **Neon**: PostgreSQL hosting
- **FastAPI**: Backend framework
- **Next.js**: Frontend framework
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: UI component library

---

**LeaveFlow** - Making leave management conversational and effortless.
