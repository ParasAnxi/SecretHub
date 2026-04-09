//IMPORTS 
//DOTENV
import dotenv from 'dotenv';
dotenv.config();

//EXPRESS
import express from 'express';
import cookieParser from 'cookie-parser';

//ROUTES
import authRoutes from './routes/auth.routes';
import postRoutes from './routes/post.routes';
import { requestLogger } from './middleware/logger.middleware';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

//APP
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cookieParser());

// TRAFFIC LOGGER
app.use(requestLogger);

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/post', postRoutes);

// GLOBAL ERROR HANDLER
app.use(errorHandler);

//SERVER
const server = async () => {
  try {
    // SYSTEM EVENT: Verify critical ENV vars without logging their values
    if (!process.env.DATABASE_URL) logger.warn('SYSTEM: DATABASE_URL is missing!');
    if (!process.env.CLOUDINARY_API_KEY) logger.warn('SYSTEM: Cloudinary keys are missing!');

    app.listen(port, () => {
      logger.system(`Server started securely on port ${port}`);
    });
  } catch (error) {
    logger.error('Server failed to start', error);
  }
};

server();