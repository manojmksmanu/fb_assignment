// backend/config/facebook.js
require("dotenv").config();

module.exports = {
  appId: process.env.FACEBOOK_APP_ID,
  appSecret: process.env.FACEBOOK_APP_SECRET,
  redirectUri: process.env.FACEBOOK_REDIRECT_URI,
};
