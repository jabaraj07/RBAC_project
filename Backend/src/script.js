import dotenv from 'dotenv';
import express from 'express';
const app = express();
import connectDB  from './config/db.js';
import AuthRouter from './routes/authRoute.js';
import AdminRouter from './routes/adminRoute.js';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();
connectDB();

app.use(express.json());
app.use(cors());

app.get('/',(req,res)=>{
    res.status(200).send("Hello World coders")
})

app.use('/api/auth', AuthRouter);
app.use('/api/users', AdminRouter);

// 404 handler for undefined routes
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(process.env.PORT,()=>{
    console.log(`Express app running in port ${process.env.PORT}`)
})