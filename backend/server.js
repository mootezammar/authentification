import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import adminRouter from './routes/adminRoute.js';
import userRouter from './routes/userRoute.js';

// Configuration de l'application
const app = express();
const port = process.env.PORT || 4000;



// Connexion à la base de données
connectDB();




// Middlewares
app.use(express.json());

app.use(cors());


// Routes
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter)


// Route de test
app.get('/', (req, res) => {
    res.send('API working');
});

// Démarrage du serveur
app.listen(port, () => {
    console.log("Server started on port", port);
});