//IMPORTS 
//DOTENV
import dotenv from 'dotenv';
dotenv.config();

//EXPRESS
import express from 'express';
import cookieParser from 'cookie-parser';

//ROUTES
import authRoutes from './routes/auth.routes';

//APP
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cookieParser());

// ROUTES
app.use('/api/auth', authRoutes);

 //SERVER
const server = async()=>{
  try {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Server did not connect:', error);
  }
}

server();