import express from 'express';
import {  loginAdmin  } from '../controllers/adminController.js';

import authAdmin from './../middlewars/authAdmin.js';


const adminRouter = express.Router();

// Route pour ajouter un médecin

adminRouter.post('/login', loginAdmin);


export default adminRouter;