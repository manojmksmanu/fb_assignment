// backend/config/facebook.js
require("dotenv").config();

module.exports = {
  appId: "914299164196328",
  appSecret: "8105987788e2a1cd3b42f4f6fda0225a",
  redirectUri:
    "https://53b0-2409-40d0-114d-b6f0-3529-926-1948-5fc.ngrok-free.app/callback",
  // appId: process.env.FACEBOOK_APP_ID,
  // appSecret: process.env.FACEBOOK_APP_SECRET,
  // redirectUri: process.env.FACEBOOK_REDIRECT_URI,
};
