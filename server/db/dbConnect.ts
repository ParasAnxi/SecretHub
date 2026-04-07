import { neon } from '@neondatabase/serverless';

//CONNECT TO DATABASE
const connectDb = async()=>{
    try {
        const DATABASE_URL : string = process.env.DATABASE_URL || "";
        if (!DATABASE_URL) {
            throw new Error("DATABASE_URL is missing!");
        }
        const sql = neon(DATABASE_URL);
        const data = await sql`SELECT current_database(), version()`;
        console.log("Database connected successfully.\nDatabase: ", data[0].current_database , "\nVersion: ", data[0].version);
    } catch (error) {
        console.error("Database connection error:", error);
    }
}

export default connectDb;