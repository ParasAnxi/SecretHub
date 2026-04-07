//IMPORTS 
//DOTENV
import dotenv from 'dotenv';
dotenv.config();

//EXPRESS
import express from 'express';

//DATABASE
import connectDb from './db/dbConnect.ts';

//APP
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

 //SERVER
const server = async()=>{
  try {
    //CONNECT TO DATABASE
    await connectDb();
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Database connection error:', error);
  }
}

server();