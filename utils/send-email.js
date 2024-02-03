const nodeMailer = require("nodemailer");

const transporter = nodeMailer.createTransport({    
  pool: true,
  secure: false,
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,  
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  tls:{
    ciphers: "SSLv3",
    rejectUnauthorized: false
  },  
});  

const sendEmail = async (options) => {  
  const mailOptions = options;
  
  transporter.sendMail(mailOptions, async function (err, info) {
    if (err) {
      console.log(err);
    }else{
      if(process.env.NODE_ENV === "development") console.log("Email sent: " + info.response);
    }    
  });  
}

module.exports = sendEmail;