const ejs = require("ejs");

const { prisma } = require("../config/prisma");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/error-handler");
const sendEmail = require("../utils/send-email");

const create = catchAsyncErrors(async (req, res, next) => {    
  const { name } = req.body;
  if(!req.file) return next(new ErrorHandler(400, "Please upload a file"));
  const file = await prisma.file.create({
    data: {
      name: name || req.file?.originalname,
      path: req.file?.filename,
      ownerId: req.user.id,
      FileUsers: {
        create: {
          userId: req.user.id,
          type: "OWNER"
        }
      }
    }
  });
  if(!file) return next(new ErrorHandler(500, "Failed to create file"));
  res.status(201).json({ 
    success: true, 
    data: file,
    message: "File created successfully"
  });
});

const getAll = catchAsyncErrors(async (req, res, next) => {
  const { name } = req.query;
  let myFiles = [];
  let where = {
    AND: [
      {
        ownerId: req.user.id
      },      
    ]    
  };
  if(name) where.AND.push({ name: { contains: name } });

  myFiles = await prisma.file.findMany({
    where,
    include: {
      FileUsers: {
        include: {
          user: {
            select: {              
              name: true,
              email: true            
            }
          }
        }
      }
    }
  });

  let sharedFiles = [];
  sharedFiles = await prisma.file.findMany({
    where: {     
      AND: [
        {
          FileUsers: {
            some: {
              userId: req.user.id
            }
          }
        },
        {
          ownerId: {
            not: req.user.id
          }
        }
      ]      
    }
  });

  res.status(200).json({
    success: true,
    data: {
      myFiles,
      sharedFiles
    },    
  });
});

const get = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const file = await prisma.file.findUnique({
    where: { 
      id,
      ownerId: req.user.id
    },
    include: {
      FileUsers: {
        include: {
          user: {
            select: {              
              name: true,
              email: true            
            }
          }
        }
      }
    }
  });
  if(!file) return next(new ErrorHandler(404, "File not found"));
  res.status(200).json({ 
    success: true, 
    data: file,    
  });
});

const shareFile = catchAsyncErrors(async (req, res, next) => {
  const { fileId, userId } = req.body;
  const ifAlreadyShared = await prisma.fileUser.findFirst({
    where: {
      fileId,
      userId
    }
  });
  if(ifAlreadyShared) return next(new ErrorHandler(400, "File already shared with this user"));
  const file = await prisma.file.findUnique({
    where: { 
      id: fileId,
      ownerId: req.user.id
    }
  });
  if(!file) return next(new ErrorHandler(404, "File not found"));
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  if(!user) return next(new ErrorHandler(404, "User not found"));
  const fileUser = await prisma.fileUser.create({
    data: {
      fileId,
      userId,
      type: "VIEWER"
    }
  });
  if(!fileUser) return next(new ErrorHandler(500, "Failed to share file"));
  if(fileUser){    
    ejs.renderFile(
      __dirname + "/../views/message-template.ejs",
      {
        title: `${req.user.name} shared a file with you!`,
        username: user.name,
        logo: `${process.env.SERVER_URL}/public/images/favicon-lg.png`,
        brand: process.env.APP_NAME,
        messages: [
          `You have been granted access to view the file: ${file.name}.`
        ],
        buttons: [],
        notWorkingLabel: "",
        notWorkingUrl: ""
      },
      async (err, data) => {
        if (err) {
          console.log(err);
        } else {
          const mailOptions = {
            from: process.env.SMTP_FROM,
            to: user.email,
            subject: `${req.user.name} shared a file with you!`,
            html: data,
          };
          await sendEmail(mailOptions);
        }
      }
    );    
  }
  res.status(200).json({ 
    success: true, 
    data: fileUser,
    message: "File shared successfully"
  });  
});

module.exports = {
  create,
  getAll,
  get,
  shareFile
};