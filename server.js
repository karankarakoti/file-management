const dotenv = require("dotenv");

dotenv.config();

console.log("✔ Bootstrapping Application");
console.log(`✔ Mode: ${process.env.NODE_ENV}`);
console.log(`✔ Port: ${process.env.PORT}`);

const app = require("./app");
const { prisma } = require("./config/prisma");

process.on("uncaughtException", (err) => {
  console.log(`ERROR: ${err.name} - ${err.message}`);
  console.log("Shutting down due to uncaught exception");
  process.exit(1);
});

const server = app.listen(process.env.PORT).on("error", (err) => {
  console.log("✘ Application failed to start");
  console.error("✘", err.message);
  process.exit(0);
}).on("listening", () => {
  console.log("✔ Application Started");
});

process.on("unhandledRejection", (err) => {
  console.log(`ERROR: ${err.name} - ${err.message}`);
  console.log("Shutting down the server due to unhandled promise rejection");
  server.close(() => {
    process.exit(1);
  });
});