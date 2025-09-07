````markdown
# Quiz Quest API

This folder contains the server-side code for the Quiz Quest application, built with modern Express.js architecture.

## 📁 Structure

```
api/
├── server.js              # Main entry point
├── package.json
└── src/
    ├── app.js             # Main application class
    ├── config/            # Configuration files
    ├── controllers/       # Request handlers
    ├── services/          # Business logic layer
    ├── routes/            # API route definitions
    ├── middleware/        # Custom middleware
    ├── socket/            # Socket.IO configuration
    └── utils/             # Utility functions
```

## 🚀 Running the API

### From the API folder:
```bash
cd api
npm install
npm start
```

For development with auto-restart:
```bash
npm run dev
```

### From the root folder:
```bash
npm run install:api
npm start
```

For development:
```bash
npm run dev:all  # Runs both API and React app
```

## Features

- Express.js web server
- Socket.IO for real-time quiz functionality
- Session management for teacher authentication
- Quiz room management
- Question and answer handling
- Quiz history storage

## Dependencies

The API has its own `package.json` with these main dependencies:
- `express` - Web framework
- `socket.io` - Real-time communication
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment configuration
- `express-session` - Session management

## Note

This follows a microservices architecture where each service (API, React app) manages its own dependencies independently.

````
