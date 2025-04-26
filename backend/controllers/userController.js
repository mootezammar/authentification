import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'



import transporter from '../config/nodemailer.js'
import { EMAIL_VERIFY_TEMPLATE , PASSWORD_RESET_TEMPLATE,WELCOME_EMAIL_TEMPLATE } from './../config/emailTemplates.js';


// api to register user

const registerUser = async (req, res) => {
    try {

        const { firstname,lastname, email, password,institution,yearofstudy,major } = req.body
        if (!firstname || !lastname  ||!institution || !password || !email ||!major ||!yearofstudy) {
            return res.json({ success: false, message:'Missing Details'})
        }
        // validate email
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message:'enter a valid email'})
            
        }
        //validating a strong pasword
        if (password.length < 8) {
            return res.json({ success: false, message:'enter a strong password'})
        }
        
        // hashing user password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt) 
        
        const userData = {
            firstname,
            lastname,
            email,
            password: hashedPassword,
            institution,
            yearofstudy,
            major
        }

        // save user in DB

        const newUser = new userModel(userData)
        const user = await newUser.save()


        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {expiresIn:'7d'})

      

        // Sending welcome email
      const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to our platform',
           // text: `Welcome. Your account has been created with email id : ${email}`,
            html: WELCOME_EMAIL_TEMPLATE.replace('{{name}}', firstname).replace('{{email}}', email)
        }

        await transporter.sendMail(mailOptions) 

        
        return res.json({success:true ,token})
        
       



    } catch (error) {
          console.log(error);
        res.json({ success: false, message: error.message });
        
    }
}

// api for user login 

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: 'User does not exist' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });


            return res.json({ success: true, token });
        } else {
            return res.json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error("Login error:", error); // Debugging line
        res.json({ success: false, message: error.message });
    }
};


// Send verification otp to user email
const sendVerifyOtp = async (req, res) => {
    try {

        const { userId } = req.body
        
        const user = await userModel.findById(userId)
        
        if (user.isAccountVerified) {
            return res.json({success:false,message:"Account Already verified"})
            
        }
        const otp = String(Math.floor(100000 + Math.random() * 900000))

        user.verifyOtp = otp
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000
        
        await user.save()

        const mailOption = {
           from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account Verification Otp',
           //text: `Your OTP is ${otp} . Verify your account using this OTP`,
           html:EMAIL_VERIFY_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)
        }

        await transporter.sendMail(mailOption)
        return res.json({success:true,message:"Verification Otp sent on your email"})
        
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message }); 
    }
}


const verifyEmail = async (req, res) => {
    const { userId,otp } = req.body

    if (!userId || !otp) {
       return res.json({success:false,message:"Missing Details"})
    }
    try {
        const user = await userModel.findById(userId)
        if (!user) {
            return res.json({success:false,message:"User not found"})
            
        }
        if (user.verifyOtp === '' || user.verifyOtp !== otp) {
            return res.json({success:false,message:"Invalid OTP"})
        }

        if (user.verifyOtpExpireAt < Date.now()) {
            return res.json({success:false,message:"OTP Expired"}) 
        }

        user.isAccountVerified = true
        user.verifyOtp = ''
        user.verifyOtpExpireAt = 0
        
        await user.save()

        return res.json({success:true,message:"Email verified Successfully"}) 
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message }); 
        
    }
    
}

// Send Password Reset Otp

const sendResetOtp = async (req, res) => {
    const { email } = req.body
    
    if (!email) {
        return res.json({success:false,message:"Email is required"}) 
        
    }
    try {
        const user = await userModel.findOne({ email })
        
        if (!user) {
             return res.json({success:false,message:"User not found"})
            
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000))

        user.resetOtp = otp
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000
        
        await user.save()

        const mailOption = {
           from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password reset OTP',
            //text: `Your OTP for resetting your password is ${otp} . Use this OTP to procced with resseting your password`,
            html:PASSWORD_RESET_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)
        }

        await transporter.sendMail(mailOption)
        return res.json({success:true,message:" OTP sent to your email"})


        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message }); 
        
    }
}

//Reset User Password 
const resetPassword = async (req, res) => {
    const { email,otp,newPassword } = req.body

    if (!email || !otp || !newPassword) {
       return res.json({success:false,message:"Email , OTP and new password are required"})
    }
    try {
        const user = await userModel.findOne({email})
        if (!user) {
            return res.json({success:false,message:"User not found"})
            
        }
        if (user.resetOtp === '' || user.resetOtp !== otp) {
            return res.json({success:false,message:"Invalid OTP"})
        }

        if (user.resetOtpExpireAt < Date.now()) {
            return res.json({success:false,message:"OTP Expired"}) 
        }

         const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(newPassword, salt) 

        user.password = hashedPassword
        
        user.resetOtp = ''
        user.resetOtpExpireAt = 0
        
        await user.save()

        return res.json({success:true,message:"Password has been reset Successfully"}) 
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message }); 
        
    }
    
}
// api to get profile 
const getprofile = async (req, res) => {
    try {
        const {userId} = req.body;
        const user = await userModel.findById(userId).select('-password')
  
        res.json({ success: true, user })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })

  
    }
}
export {loginUser,registerUser,sendResetOtp,sendVerifyOtp,resetPassword,verifyEmail,getprofile}