const bcrypt = require("bcrypt");
const ejs = require("ejs");
const jwt = require("jsonwebtoken");

const { prisma } = require("../config/prisma");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/error-handler");
const sendEmail = require("../utils/send-email");

let cookieOptions = {
  expires: new Date(
    Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
  ),
}
if(process.env.NODE_ENV === "production"){
  cookieOptions = {
    ...cookieOptions,
    sameSite: "none",
    secure: true
  }
}else{
  cookieOptions = {
    ...cookieOptions,
    httpOnly: true
  }
}

const login = catchAsyncErrors(async (req, res, next) => {    
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler(400, "Please provide all fields"));
  }  
  const user = await prisma.user.findUnique({
    where: {
      email,
    }
  });           
  if(!user) return next(new ErrorHandler(401, "Invalid credentials"));
  if(!user.isVerified) return next(new ErrorHandler(401, "Your account is not verified. Please verify your email."));
  const isMatch = await bcrypt.compare(password, user.password);
  if(!isMatch) return next(new ErrorHandler(401, "Invalid credentials"));
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
  user.password = undefined;
  res
  .cookie("token", token, cookieOptions)
  .status(200)
  .json({
    success: true,
    data: {
      user
    }
  });
});

const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .clearCookie("token")
    .json({
      success: true,
      message: "Logged Out"
    });
});

const register = catchAsyncErrors(async (req, res, next) => {
  const {       
    email, 
    name,       
    password     
  } = req.body;
  if (!name || !email || !password) {
    return next(new ErrorHandler(400, "Please provide all fields"));
  }    

  const _user = await prisma.user.findUnique({
    where: {
      email,
    }
  });          
  if(_user) return next(new ErrorHandler(400, "User already exists"));    
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      name,        
      password: hashedPassword,        
    }
  });

  const verifyToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  const verifyUrl = `${process.env.SERVER_URL}/api/v1/auth/verify-email?token=${verifyToken}`;
      
  if(verifyUrl){
    ejs.renderFile(
      __dirname + "/../views/message-template.ejs",
      {
        title: "Account Created Successfully!",
        username: user.name,
        logo: `${process.env.SERVER_URL}/public/images/favicon-lg.png`,
        brand: process.env.APP_NAME,
        messages: [
          "Your account has been created successfully. Please use the password below to login.",
        ],
        buttons: [
          {
            label: "Verify Email",
            url: verifyUrl
          }          
        ],
        notWorkingLabel: "If the button above is not working, please click on the link below to verify your email.",
        notWorkingUrl: verifyUrl
      },
      async (err, data) => {
        if (err) {
          console.log(err);
        } else {
          const mailOptions = {
            from: process.env.SMTP_FROM,
            to: user.email,
            subject: "Account Created",
            html: data,
          };
          await sendEmail(mailOptions);
        }
      }
    );
  }    
  user.password = undefined;
  res    
    .status(200)
    .json({
      success: true,
      data: {
        user
      },
      message: "Registration successful. Please check your email for further instructions."
    });
});

const getProfile = catchAsyncErrors(async (req, res, next) => {            
  const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      }
    });          
  if(!user) return next(new ErrorHandler(401, "User not found"));    
  if(!user.isVerified) return next(new ErrorHandler(401, "Your account is not verified. Please verify your email."));
  user.password = undefined;
  res    
  .status(200)
  .json({
    success: true,
    data: {
      user
    }
  });
});

const verifyEmail = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.query;
  if (!token) {
    return next(new ErrorHandler(400, "Invalid token"));
  }
  const decodedData = jwt.verify(token, process.env.JWT_SECRET);
  const user = await prisma.user.findUnique({
    where: {
      id: decodedData.id,
    }
  });
  if(!user) return next(new ErrorHandler(400, "Invalid token"));
  if(user.isVerified) return next(new ErrorHandler(400, "Email already verified"));
  user.isVerified = true;
  await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      isVerified: true
    }
  });
  
  res
    .status(200)
    .json({
      success: true,
      message: "Email verified successfully"
    });
});

module.exports = {
  login,
  logout,
  register,  
  getProfile,  
  verifyEmail
};