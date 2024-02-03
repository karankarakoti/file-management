const fs = require("fs");
const multer = require("multer");
const path = require("path");
const shortid = require("shortid");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {        
    const dir = path.resolve( `${__dirname }/${process.env.UPLOAD_PATH}`);    
    fs.exists(dir, (exist) => {
      if (!exist) {
        return fs.mkdir(dir, (error) => cb(error, dir));
      }
      return cb(null, dir);
    });        
  },
  filename: function (req, file, cb) {
    const fileName = shortid.generate() + (new Date()).getTime() + path.extname(file.originalname);    
    cb(null, fileName);
  },
});

exports.upload = multer({ 
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 10 },
});

exports.removeFile = (file) => {
  try{
    const url = `${__dirname }/${process.env.UPLOAD_PATH}/${file}`
    fs.unlink(url, (err) => {
      if(err){
        console.log(err);        
      }
    });
  }catch(err){
    console.log(err);    
  }
}