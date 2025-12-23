# Track My Academy - Sports Academy Management Platform

## Product Overview
Track My Academy is a comprehensive SaaS platform designed specifically for sports academy owners and management in India. We are not targeting individual athletes but rather focusing on academy owners who need to manage their operations and provide player access through their institutional portals.

### Target Audience
- **Primary**: Sports academy owners and administrators
- **Secondary**: Players (access through their academy's portal)
- **Geographic Focus**: India (starting with Tamil Nadu)

### Current Status
- **Beta Testing Phase**: SaaS platform is ready for beta testing
- **Smart Equipment**: IoT gadgets and smart sports equipment in development
- **Launch Timeline**: Full launch planned for 2025

## Technology Stack

### Frontend
- **Framework**: React 19.0.0
- **Build Tool**: CRACO (Create React App Configuration Override)
- **Styling**: Tailwind CSS 3.4.17
- **Routing**: React Router DOM 7.5.1
- **HTTP Client**: Axios 1.8.4
- **Package Manager**: Yarn 1.22.22

### Backend
- **Framework**: FastAPI 0.110.1
- **Database**: MongoDB (Motor 3.3.1 for async operations)
- **Authentication**: JWT-based authentication
- **Environment**: Python with asyncio
- **Deployment**: Supervisor process management

### Key Features Implemented

#### 1. SaaS Platform Features
- Academy management dashboard
- Player performance tracking
- Training program management
- Real-time analytics and reporting
- Multi-academy support for enterprise clients

## Architecture

### Academy-First Approach
Unlike other platforms that target individual athletes, Track My Academy follows an academy-centric model:

1. **Academy Owners**: Primary users who manage the platform, set up player accounts, and access all administrative features
2. **Player Access**: Players log in through their academy's portal and can only access their personal data and assigned training programs
3. **Data Hierarchy**: All player data belongs to the academy, ensuring proper institutional control

### User Flow
1. Academy owner signs up and configures their academy
2. Academy owner creates player accounts within their academy
3. Players receive credentials to access their personal dashboard
4. All performance data and analytics are managed at the academy level
5. Players can view their progress but cannot access other players' data

## Environment Configuration

### Frontend Environment Variables
```
REACT_APP_BACKEND_URL=https://login-fix-97.preview.emergentagent.com
WDS_SOCKET_PORT=443
```

### Backend Environment Variables
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
```

## Development Setup

### Prerequisites
- Node.js and Yarn
- Python 3.8+
- MongoDB
- Supervisor for process management

### Installation
1. **Frontend Setup**:
   ```bash
   cd frontend
   yarn install
   yarn start
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python server.py
   ```

3. **Service Management**:
   ```bash
   sudo supervisorctl restart frontend
   sudo supervisorctl restart backend
   sudo supervisorctl restart all
   ```

## Beta Program

### Current Status
- Beta testing program is active
- Limited number of academies being onboarded
- Collecting feedback for full launch optimization

### Beta Features
- Complete SaaS platform access
- Academy management tools
- Player performance tracking
- Basic IoT integration (as equipment becomes available)
- Dedicated beta support

## API Structure

### Authentication
- Academy-level authentication
- Player authentication through academy portal
- JWT-based session management
- Role-based access control (Academy Admin, Coach, Player)

### Core Endpoints
- `/api/academy/` - Academy management
- `/api/players/` - Player management (academy-scoped)
- `/api/performance/` - Performance tracking
- `/api/analytics/` - Data analytics and reporting


## Future Roadmap

### Phase 1: Beta Completion (Q1 2025)
- Complete beta testing with 25+ academies
- Finalize SaaS platform features
- IoT device prototype completion

### Phase 2: Full Launch (Q2 2025)
- Public launch across India
- Smart equipment market release
- Mobile app launch

### Phase 3: Expansion (Q3-Q4 2025)
- Multi-sport support expansion
- Advanced AI analytics
- Integration with other sports platforms

## Technical Notes for Future Development

### Database Schema
- Academy-centric data model
- Player data always linked to academy
- Performance metrics tied to both academy and individual players
- Proper data isolation between different academies

### Security Considerations
- Academy-level data segregation
- Player privacy within academy context
- Secure authentication and authorization
- Data encryption for sensitive information

### Scalability Features
- Multi-academy enterprise support
- Cloud-based infrastructure ready
- API-first architecture for integrations
- Mobile app development ready
