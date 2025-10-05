import { CorsOptions } from 'cors';

// Development origins (always allowed in dev)
const devOrigins = [
  'http://localhost:5173',      // Vite dev server
  'http://127.0.0.1:5173',      // Vite dev server (IP)
  'http://localhost:3000',      // API server
  'http://127.0.0.1:3000'       // API server (IP)
];

// Production origins from environment variables
// Format: comma-separated list
// Examples:
//   - With domain: "https://yourdomain.com,https://www.yourdomain.com"
//   - With public IP: "http://123.45.67.89,http://123.45.67.89:3000"
//   - Mixed: "http://192.168.1.100,https://mysite.com"
const prodOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : [];

// Combine origins based on environment
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [...prodOrigins] // Production: only use specified origins
  : [...devOrigins, ...prodOrigins]; // Development: allow both

const corsConfig: CorsOptions = {
  origin: allowedOrigins,
  credentials: true,
  allowedHeaders: ['Content-Type'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

export default corsConfig;
