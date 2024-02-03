const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const routesPath = path.resolve(`${__dirname}/../routes`);
const PATHS = fs.readdirSync(routesPath);
const moduleMapper = [];

console.log("✔ Mapping Routes");

PATHS.forEach((module) => {
  if(module !== "index.js"){
    const name = module.split(".")[0];
    router.use(`/${name}`, require(path.resolve(routesPath, module)));
    moduleMapper.push({
      "Module": name,
      "Route": `/${name}`
    });
  }
});

console.table(moduleMapper);

module.exports = router;