module.exports = {
  apps: [
    {
      name: "docker",
      script: "./bot.js",
      env: {
        NODE_ENV: "development",
        GOOGLE_APPLICATION_CREDENTIALS: "/usr/src/app/config/google-auth.json",
      },
    },
  ],
};
