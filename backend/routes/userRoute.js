import express from 'express'
import {
    registerUser, loginUser, 
     sendVerifyOtp, verifyEmail, sendResetOtp, resetPassword,
     getprofile,
    
} from '../controllers/userController.js'
import authUser from './../middlewars/authUser.js';



const userRouter = express.Router()

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.post('/send-verify-otp', authUser, sendVerifyOtp)
userRouter.post('/verify-account', authUser, verifyEmail)
userRouter.post('/send-reset-otp', sendResetOtp)
userRouter.post('/reset-password', resetPassword)
userRouter.get('/get-profile',authUser, getprofile)




export default userRouter