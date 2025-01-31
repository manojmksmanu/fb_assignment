const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/login", (req, res) => {
  const { appId, redirectUri } = require("../config/facebook");
  console.log(appId, redirectUri);
  const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?
    client_id=${appId}
    &redirect_uri=${redirectUri}
    &scope=pages_show_list,pages_read_insights
    &response_type=code`;

  res.redirect(authUrl);
});

router.get("/callback", async (req, res) => {
  const { code } = req.query;
  const { appId, appSecret, redirectUri } = require("../config/facebook");

  console.log(appId, appSecret, redirectUri);

  try {
    const tokenResponse = await axios.get(
      `https://graph.facebook.com/v20.0/oauth/access_token`,
      {
        params: {
          client_id: appId,
          client_secret: appSecret,
          code,
          redirect_uri: redirectUri,
        },
      }
    );

    const { access_token } = tokenResponse.data;

    const userProfile = await axios.get(`https://graph.facebook.com/me`, {
      params: { fields: "id,name,picture", access_token },
    });

    const pagesResponse = await axios.get(
      `https://graph.facebook.com/me/accounts`,
      {
        params: { access_token },
      }
    );

    res.json({
      user: userProfile.data,
      pages: pagesResponse.data.data,
      accessToken: access_token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/page-insights", async (req, res) => {
  const { pageId, accessToken } = req.query;
  const metrics = [
    "page_followers",
    "page_impressions",
    "page_engagement",
    "page_post_reactions_total",
  ];

  try {
    const insightsResponse = await axios.get(
      `https://graph.facebook.com/v20.0/${pageId}/insights`,
      {
        params: {
          metric: metrics.join(","),
          access_token: accessToken,
          period: "total_over_range",
        },
      }
    );

    res.json(insightsResponse.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
