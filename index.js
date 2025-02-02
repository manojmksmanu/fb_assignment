require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

if (!express) {
  throw new Error("Express module is not properly imported or installed.");
}

const app = express();

// CORS Configuration
const corsOptions = {
  origin: "*", // Allow all origins (can be restricted to specific origins)
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions)); // Apply CORS configuration
app.use(express.json());

const FACEBOOK_APP_ID = "914299164196328";
const FACEBOOK_APP_SECRET = "8105987788e2a1cd3b42f4f6fda0225a";
const REDIRECT_URI = "https://fb-assignment.onrender.com/callback";

if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
  throw new Error(
    "Missing required environment variables: FACEBOOK_APP_ID or FACEBOOK_APP_SECRET"
  );
}

// Exchange code for access token
app.get("/auth/facebook", async (req, res) => {
  const { code } = req.query;
  try {
    if (!code) {
      return res.status(400).json({ error: "Missing code parameter" });
    }

    const tokenResponse = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token`,
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
    console.error("Error during Facebook token exchange:", error.message);
    res.status(500).json({ error: "Failed to exchange code for access token" });
  }
});

// Fetch user profile
app.get("/me", async (req, res) => {
  const { access_token } = req.query;
  try {
    if (!access_token) {
      return res.status(400).json({ error: "Missing access_token parameter" });
    }

    const userProfile = await axios.get(
      `https://graph.facebook.com/v18.0/me?fields=id,name,picture`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );
    res.json(userProfile.data);
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Fetch pages managed by user
app.get("/pages", async (req, res) => {
  const { access_token } = req.query;
  try {
    if (!access_token) {
      return res.status(400).json({ error: "Missing access_token parameter" });
    }

    const pages = await axios.get(
      `https://graph.facebook.com/v18.0/me/accounts`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );
    console.log(pages.data);
    res.json(pages.data);
  } catch (error) {
    console.error("Error fetching pages:", error.message);
    res.status(500).json({ error: "Failed to fetch pages" });
  }
});

app.get("/page-insights", async (req, res) => {
  const { page_id, access_token } = req.query;
  console.log(page_id, access_token);

  // Ensure that page_id and access_token are provided
  if (!page_id || !access_token) {
    return res.status(400).json({ error: "Missing page_id or access_token" });
  }

  const validMetrics = [
    "page_fans",
    "page_impressions",
    "page_total_actions",
    "page_post_engagements",
  ];

  let params = {
    access_token,
    metric: validMetrics.join(","),
  };

  console.log(
    `Requesting: https://graph.facebook.com/v22.0/${page_id}/insights`
  );
  console.log("Request params:", params);

  try {
    const response = await axios.get(
      `https://graph.facebook.com/v22.0/${page_id}/insights`,
      { params }
    );

    console.log("Facebook API Response:", response.data);
    if (
      !response.data ||
      !response.data.data ||
      response.data.data.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "No data available for the requested metrics" });
    }

    res.json({
      success: true,
      data: response.data.data.map((item) => ({
        ...item,
        name: formatName(item.name) || ,
        title: item.title || item.name,
        description: item.description || "",
        values: item.values.map((value) => ({
          value: value.value,
          end_time: value.end_time,
        })),
      })),
      isFiltered: false,
    });

    function formatName(name) {
      if (!name) return ""; // Handle case where name is undefined or null
      return name
        .replace(/_/g, " ") // Replace underscores with spaces
        .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
    }
  } catch (error) {
    console.error(
      "Error fetching insights:",
      error.response?.data || error.message
    );

    // Return the error response with status and details
    res.status(error.response?.status || 500).json({
      error: "Error fetching insights",
      details: error.response?.data || error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
