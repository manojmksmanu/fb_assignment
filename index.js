require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

if (!express) {
  throw new Error("Express module is not properly imported or installed.");
}

const app = express();

app.use(cors());
app.use(express.json());

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const REDIRECT_URI =
  "https://53b0-2409-40d0-114d-b6f0-3529-926-1948-5fc.ngrok-free.app/callback";

if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
  throw new Error(
    "Missing required environment variables: FACEBOOK_APP_ID or FACEBOOK_APP_SECRET"
  );
}

// Exchange code for access token
app.get("/auth/facebook", async (req, res) => {
  const { code } = req.query;
  try {
    const tokenResponse = await axios.get(
      `https://graph.facebook.com/v17.0/oauth/access_token`,
      {
        params: {
          client_id: FACEBOOK_APP_ID,
          client_secret: FACEBOOK_APP_SECRET,
          redirect_uri: REDIRECT_URI,
          code,
        },
      }
    );
    res.json(tokenResponse.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch user profile
app.get("/me", async (req, res) => {
  const { access_token } = req.query;
  try {
    const userProfile = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,picture`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );
    res.json(userProfile.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch pages managed by user
app.get("/pages", async (req, res) => {
  const { access_token } = req.query;
  try {
    const pages = await axios.get(`https://graph.facebook.com/me/accounts`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    res.json(pages.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch page insights
app.get("/page-insights", async (req, res) => {
  const { page_id, access_token, since, until } = req.query;
  try {
    const insights = await axios.get(
      `https://graph.facebook.com/${page_id}/insights`,
      {
        params: {
          metric:
            "page_fan_adds,page_engaged_users,page_impressions,page_actions_post_reactions_total",
          since,
          until,
          period: "total_over_range",
          access_token,
        },
      }
    );
    res.json(insights.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
