const jwt = require("jsonwebtoken");
const { prisma } = require("../config/prisma");
const catchAsyncErrors = require("./catchAsyncErrors");
const ErrorHandler = require("../utils/error-handler");

const getUser = async (id) => {    
  const user = await prisma.user.findUnique({
    where: {
      id: id,
    },
    select: {
      id: true,
      name: true,      
      email: true,      
      isVerified: true,      
    }
  });  
  return user;
}

const isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {        
  const { token } = req.cookies;    
  if (!token) return next(new ErrorHandler(401, "Please Login to access this Resource"));        
  const decodedData = jwt.verify(token, process.env.JWT_SECRET);        
  let user = await getUser(decodedData.id);    
  if(!user) return next(new ErrorHandler(401, "Please Login to access this Resource"));
  if(!user.isVerified) return next(new ErrorHandler(401, "Please Verify your email to access this Resource"));
  req.user = user;   
  next();        
});


const protectedMediaAuthentication = catchAsyncErrors(async (req, res, next) => {    
  const { id } = req.params;    
  let data;
  const file = await prisma.file.findUnique({
    where: {
      id
    },
    include: {
      FileUsers: {
        where: {
          userId: req.user.id
        }
      }
    }
  });
  if(!file) return next(new ErrorHandler(404, "File not found"));
  if(file.FileUsers.length === 0) return next(new ErrorHandler(403, "You are not allowed to access this resource"));
  req.filePath = file.path;
  next();  
});

module.exports = {
  isAuthenticatedUser,
  protectedMediaAuthentication
};