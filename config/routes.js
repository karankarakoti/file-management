const express = require("express");
const path = require("path");

const apiRoutes = require("../utils/api-routes");
const { protectedMediaAuthentication, isAuthenticatedUser } = require("../middleware/auth");

module.exports.setRoutes = (app) => {
  app.get("/", (req, res) => {
    res.render(
      "common-template.ejs",
      {
        title: `Welcome to ${process.env.APP_NAME}`,
        desc: "Server Running🔥🔥",
        brand: process.env.APP_NAME,
      }
    );
  });

  app.use("/api/v1", apiRoutes);

  app.use("/public", express.static(path.join(__dirname, "../public")));
  app.use("/file/:id", isAuthenticatedUser, protectedMediaAuthentication, (req, res) => {    
    res.sendFile(path.join(__dirname, process.env.UPLOAD_PATH, req.filePath));
  });

  app.use("/*", (req, res) => {
    res.render(
      "common-template.ejs",
      {
        title: "404 Not Found",
        desc: "🚫Not Found🚫",
        brand: process.env.APP_NAME,
      }     
    );
  })
}