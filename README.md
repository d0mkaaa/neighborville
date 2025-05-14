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

### Environment Variables

The following environment variables are available:

- `VITE_API_URL`: Your API server URL
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
