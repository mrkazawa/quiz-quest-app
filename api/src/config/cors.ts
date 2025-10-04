import { CorsOptions } from 'cors';

const corsConfig: CorsOptions = {
  origin: [
    'http://localhost:5173', 
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  allowedHeaders: ['Content-Type'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

export default corsConfig;
