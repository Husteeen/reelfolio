import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

export const config = {
  port:          parseInt(process.env.PORT || '4000', 10),
  nodeEnv:       process.env.NODE_ENV || 'development',
  sessionSecret: process.env.SESSION_SECRET || 'reelfolio-dev-secret-change-in-prod',
  clientOrigin:  process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  databaseUrl:   process.env.DATABASE_URL  || '',
};
