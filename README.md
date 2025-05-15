# 🏙️ neighborville

A city-building simulation game built for [Hack Club Neighborhood](https://neighborhood.hackclub.com/), where you can build your own virtual community, manage resources, and keep your residents happy!

## 🎮 Game Features

- **City Building**: Design and build your neighborhood with various buildings, houses, and community spaces
- **Resource Management**: Balance income, happiness, and energy usage
- **Dynamic Weather & Day/Night Cycle**: Experience changing weather patterns and a day/night cycle
- **Neighbor System**: House neighbors with unique traits, preferences, and personalities
- **Random Events**: Face unexpected events that challenge your management skills
- **Achievement System**: Unlock achievements as you develop your neighborhood
- **Energy Management**: Monitor and reduce your city's energy consumption
- **Housing System**: Assign your neighbors to appropriate housing based on their preferences
- **Email Verification**: Secure user authentication with simulated email verification codes

## 🚀 tools used

- [React](https://react.dev/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vitejs.dev/) - Fast development environment
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [Lucide Icons](https://lucide.dev/) - UI icons
- [Docker](https://www.docker.com/) - Containerization
- [Nginx](https://nginx.org/) - Web server

## 🛠️ Development

### prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### getting started

1. Clone the repository:
   ```bash
   git clone https://github.com/d0mkaaa/neighborville.git
   cd neighborville
   ```

2. Create and configure your environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration values.

3. Build and start the containers:
   ```bash
   docker-compose up --build
   ```

4. Open [http://localhost](http://localhost) in your browser

### Production Mode

In production, the application will use:

1. The `VITE_API_URL` environment variable for API requests
2. The CORS settings defined in `ALLOWED_ORIGINS` for server security

### Environment Variables

The following environment variables are available:

- `VITE_API_URL`: Your API server URL (only needed in production)
- `VITE_WS_URL`: Your WebSocket server URL
- `VITE_EMAIL_FROM`: Email sender address (e.g., hello@domka.me)
- `VITE_EMAIL_FROM_NAME`: Email sender name

### authentication system

NeighborVille features a comprehensive authentication system with the following features:

1. **Session Management**:
   - Browser-local sessions with configurable expiration time
   - Automatic session refresh for active users
   - Ability to manage multiple sessions across devices

2. **User Types**:
   - Guest users with limited functionality
   - Registered users with email verification
   - User settings persistence

3. **Security Features**:
   - Session validation on app load and during usage
   - Automatic logout on session expiration
   - Session tracking with user agent information

4. **Environment Configuration**:
   - Configurable session timeout via environment variables
   - Mailtrap integration for production email testing
   - Development fallbacks for email verification

## Authentication System

### Security Improvements

The authentication system has been enhanced with the following improvements:

1. **Session-based Storage**: User data is now stored in `sessionStorage` instead of `localStorage` for improved security. This means user data is automatically cleared when the browser session ends.

2. **Automatic 401 Handling**: The system now properly detects unauthorized (401) responses from the API and automatically shows the login modal. This ensures users aren't left in a broken state when their session expires.

3. **Event-based Authentication**: The system uses custom events (`auth:unauthorized`) to communicate authentication failures across components, ensuring a consistent user experience.

4. **Centralized Auth Context**: All authentication logic is centralized in the AuthContext, making it easier to maintain and extend.

### Usage

The authentication system provides the following hooks and components:

```tsx
// Using the auth context
const { 
  user,             // Current user object or null
  isAuthenticated,  // Whether the user is authenticated (not a guest)
  isGuest,          // Whether the user is a guest
  login,            // Function to log in a user
  logout,           // Function to log out
  refreshAuth,      // Function to refresh authentication
  showLogin,        // Whether to show the login modal
  setShowLogin      // Function to show/hide the login modal
} = useAuth();
```

## 📚 Project Structure

- `src/components/game/` - Game components like buildings, residents, events
- `src/components/ui/` - Reusable UI components
- `src/components/auth/` - Authentication components and flows
- `src/services/` - Services for email verification and storage
- `src/data/` - Game data (buildings, events, neighbors, achievements)
- `src/types/` - TypeScript type definitions

## 👥 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to help improve neighborville.

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

## Development Environment

### Local Development without SSL

For local development, you can use the provided development configuration that doesn't require SSL certificates.

1. Build and run the development environment:
   ```bash
   # Run with development configuration
   docker-compose -f docker-compose.dev.yml up --build
   ```

2. Access the application:
   - Frontend: [http://localhost](http://localhost)
   - API: [http://api.localhost](http://api.localhost) (add this to your hosts file)

3. For development without Docker:
   ```bash
   # Start the backend server
   cd server
   NODE_ENV=development npm run dev

   # Start the frontend in a separate terminal
   npm run dev
   ```

This development setup:
- Uses the `nginx.dev.conf` which doesn't require SSL certificates
- Configures all services to work on standard non-SSL ports
- Sets NODE_ENV to development automatically
