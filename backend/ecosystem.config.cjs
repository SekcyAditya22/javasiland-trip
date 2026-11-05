const path = require("node:path");

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

module.exports = {
  apps: [
    {
      name: "java-island-trip-frontend",
      cwd: path.join(__dirname, "frontend"),
      script: npmCommand,
      args: "run dev",
      interpreter: "none",
      autorestart: true,
      watch: false,
      env: { NODE_ENV: "development" },
    },
    {
      name: "java-island-trip-backend",
      cwd: path.join(__dirname, "backend"),
      script: npmCommand,
      args: "run dev",
      interpreter: "none",
      autorestart: true,
      watch: false,
      env: { NODE_ENV: "development" },
    },
  ],
};
