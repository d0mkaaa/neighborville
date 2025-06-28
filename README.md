# 🏙️ NeighborVille v1.0.0-live

A modern city-building simulation game with real-time updates, featuring live GitHub integration, comprehensive user management, and family-friendly community features. Build your dream neighborhood, manage resources, compete on leaderboards, and grow your virtual city!

🚀 **Live Version**: Currently running v1.0.0-live with real-time GitHub integration for instant updates!

## ✨ Key Features

### 🎮 **Core Gameplay**
- **Advanced City Building**: Design neighborhoods with 25+ building types including residential, commercial, utilities, and decorations
- **Economic Simulation**: Manage coins, resources (wood, stone, iron ore), and city budget with dynamic pricing
- **Resource Production**: Complex production chains with material requirements and building dependencies
- **Day/Night Cycle**: Dynamic time system affecting gameplay, building efficiency, and visual aesthetics
- **Weather System**: Dynamic weather patterns impacting city operations and resident mood
- **Achievement System**: 20+ achievements to unlock with progress tracking and rewards

### 🏆 **Social & Competition**
- **Global Leaderboards**: Compete with players worldwide by level, building count, and city progress
- **User Profiles**: Customizable profiles with bio, location, interests, and privacy settings
- **Public City Viewing**: Showcase your city to other players (with privacy controls)
- **User Search**: Find and connect with other city builders globally

### 💾 **Modern Infrastructure**
- **Cloud Save System**: Automatic cloud saves with 30-save history and cross-device sync
- **Live GitHub Integration**: Real-time version tracking directly from GitHub repository
- **Auto-Updates**: Automatic update notifications and version management
- **Progressive Web App**: Works offline and can be installed on any device

### 🛡️ **Security & Moderation**
- **Family-Safe Environment**: Comprehensive content moderation for usernames, profiles, and user content
- **Admin Dashboard**: Complete user management, moderation logs, and security monitoring
- **Suspension System**: Unified user and IP suspension with appeal process
- **Two-Factor Authentication**: TOTP support with backup codes for account security

### 📊 **Advanced Systems**
- **Tutorial & Wiki**: Comprehensive in-game help system and building encyclopedia
- **Settings Management**: Granular game settings, audio controls, and accessibility options
- **Responsive Design**: Fully responsive interface working on desktop, tablet, and mobile
- **Animations**: Smooth Framer Motion animations throughout the interface

## 🛠️ **Technology Stack**

### **Frontend**
- **React 18** - Modern UI framework with concurrent features
- **TypeScript** - Type-safe development with enhanced IDE support
- **Vite** - Lightning-fast development and optimized production builds
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **Framer Motion** - Professional animations and micro-interactions
- **Lucide React** - Beautiful, consistent iconography

### **Backend**
- **Node.js + Express** - High-performance server architecture
- **MongoDB + Mongoose** - Flexible NoSQL database with ODM
- **JWT Authentication** - Secure session management
- **Nodemailer** - Professional email verification system
- **Express Rate Limiting** - API protection and abuse prevention

### **DevOps & Infrastructure**
- **Docker** - Containerized deployment
- **Nginx** - High-performance web server and reverse proxy
- **GitHub Integration** - Live version tracking and automated updates
- **Environment Management** - Secure configuration handling

## 🚀 **Quick Start**

### **Prerequisites**
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js 22+](https://nodejs.org/) (for local development)
- [Git](https://git-scm.com/) for repository management

### **Installation**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/d0mkaaa/neighborville.git
   cd neighborville
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Launch with Docker:**
   ```bash
   # Production build
   docker-compose up --build

   # Development build (with hot reload)
   docker-compose -f docker-compose.dev.yml up --build
   ```

4. **Access the application:**
   - **Frontend**: [http://localhost](http://localhost)
   - **API**: [http://api.localhost](http://api.localhost)

### **Local Development**

```bash
# Backend server
cd server
npm install
npm run dev

# Frontend development server (new terminal)
cd neighborville
npm install
npm run dev
```

## ⚙️ **Configuration**

### **Environment Variables**

**Frontend (.env):**
```bash
VITE_API_URL=http://localhost:3001          # API endpoint
VITE_WS_URL=ws://localhost:3001             # WebSocket endpoint
VITE_EMAIL_FROM=hello@domka.me              # Email sender
VITE_EMAIL_FROM_NAME=NeighborVille          # Email sender name
```

**Backend (server/.env):**
```bash
NODE_ENV=development                         # Environment mode
MONGODB_URI=mongodb://localhost:27017/neighborville
JWT_SECRET=your-super-secure-secret-key
ADMIN_SECRET=neighborville_admin_2024       # Admin promotion key
ADMIN_SETUP_KEY=neighborville-admin-setup-2024

# Email Configuration (Mailtrap for testing)
MAILTRAP_HOST=smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your-mailtrap-user
MAILTRAP_PASS=your-mailtrap-password
EMAIL_FROM=hello@domka.me
```

## 📁 **Project Structure**

```
neighborville/
├── 📁 src/                          # Frontend source code
│   ├── 📁 components/               # React components
│   │   ├── 📁 game/                # Game-specific components
│   │   ├── 📁 ui/                  # Reusable UI components
│   │   ├── 📁 auth/                # Authentication components
│   │   ├── 📁 admin/               # Admin panel components
│   │   └── 📁 profile/             # User profile components
│   ├── 📁 services/                # API and service layer
│   ├── 📁 data/                    # Game data and configurations
│   ├── 📁 types/                   # TypeScript type definitions
│   ├── 📁 context/                 # React context providers
│   └── 📁 hooks/                   # Custom React hooks
├── 📁 server/                      # Backend source code
│   ├── 📁 src/
│   │   ├── 📁 controllers/         # Request handlers
│   │   ├── 📁 models/              # Database models
│   │   ├── 📁 routes/              # API route definitions
│   │   ├── 📁 middleware/          # Express middleware
│   │   └── 📁 services/            # Business logic services
│   └── 📁 config/                  # Server configuration
├── 📁 public/                      # Static assets
├── 📄 docker-compose.yml           # Production Docker setup
├── 📄 docker-compose.dev.yml       # Development Docker setup
└── 📄 README.md                    # This file
```

## 🎮 **Game Features Deep Dive**

### **Building System**
- **25+ Building Types**: Houses, shops, utilities, decorations, and special buildings
- **Upgrade Paths**: Buildings can be upgraded for better efficiency and appearance
- **Resource Requirements**: Each building requires specific materials to construct
- **Placement Strategy**: Grid-based building system with adjacency bonuses

### **Economy Management**
- **Starting Capital**: New players begin with 2000 coins
- **Income Generation**: Buildings provide daily income based on type and upgrades
- **Resource Trading**: Buy and sell materials through the marketplace
- **Budget Tracking**: Comprehensive financial overview and coin history

### **Progression System**
- **Experience Points**: Gain XP through building, upgrading, and daily activities
- **Level Unlocks**: New buildings and features unlock as you level up
- **Achievement Rewards**: Bonus coins and XP for completing challenges
- **Leaderboard Rankings**: Global competition across multiple categories

## 🛡️ **Security & Moderation**

### **Content Moderation**
- **Family-Safe Policy**: Comprehensive filtering of inappropriate usernames and content
- **Real-time Scanning**: Automatic detection of prohibited language and patterns
- **Appeals Process**: Users can appeal moderation decisions through structured system
- **Logging**: All moderation actions are logged for admin review

### **User Management**
- **Role-Based Access**: User, Moderator, and Admin permission levels
- **Account Verification**: Email verification required for full account access
- **Session Management**: Secure session handling with automatic expiration
- **Privacy Controls**: Users control profile visibility and data sharing

## 🌟 **What's New in v1.0.0-live**

### **🔥 Live GitHub Integration**
- Real-time version tracking from GitHub repository
- Automatic update notifications when new commits are pushed
- Live commit information displayed in-game
- Seamless update experience without manual version management

### **⚡ Enhanced Performance**
- Optimized rendering for large cities (1000+ buildings)
- Improved load times through code splitting and lazy loading
- Memory usage optimization for extended play sessions
- Smooth animations even on lower-end devices

### **🎨 UI/UX Improvements**
- Modern glassmorphism design language
- Smooth page transitions and micro-interactions
- Improved mobile responsiveness
- Accessibility enhancements for screen readers

### **🔐 Advanced Security**
- Enhanced content moderation system
- Improved admin tools and security monitoring
- Better rate limiting and abuse prevention
- Secure authentication flow improvements

## 🚀 **Deployment**

### **Production Deployment**

1. **Environment Setup:**
   ```bash
   # Set production environment variables
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://your-cluster/neighborville
   # ... other production configs
   ```

2. **Docker Production:**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

3. **Health Checks:**
   - Frontend: `http://your-domain/`
   - API Health: `http://your-domain/api/health`
   - Database: Monitor MongoDB connection

### **Performance Optimization**
- Enable gzip compression in Nginx
- Configure Redis for session storage (optional)
- Set up CDN for static assets
- Monitor application metrics and logs

## 🤝 **Contributing**

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and test thoroughly
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### **Development Guidelines**
- Follow TypeScript best practices
- Maintain test coverage for new features
- Use conventional commit messages
- Update documentation for new features

## 📞 **Support & Community**

- **Issues**: [GitHub Issues](https://github.com/d0mkaaa/neighborville/issues)
- **Email**: domantas@domkutis.com

## 👨‍💻 **About the Developer**

**Created by d0mkaaa (Domantas Rutkauskas)**
- Passionate full-stack developer from Lithuania 🇱🇹
- Building modern web experiences with love ❤️
- Always open to feedback and collaboration!

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

**🏙️ NeighborVille v1.0.0-live** - Building the future of browser-based city simulation games with cutting-edge web technologies and real-time features.

*Made with ❤️ for city builders everywhere | Featuring live GitHub integration and real-time updates! 🚀*
