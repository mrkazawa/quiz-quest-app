# Quiz Quest API

This folder contains the server-side code for the Quiz Quest application.

## Structure

- `server.js` - Main Express.js server with Socket.IO for real-time communication

## Running the API

From the root folder:
```bash
npm install
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## Features

- Express.js web server
- Socket.IO for real-time quiz functionality
- Session management for teacher authentication
- Quiz room management
- Question and answer handling
- Quiz history storage

## Note

This is part of a monorepo structure. Dependencies are managed from the root `package.json` file.
