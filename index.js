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
      `https://graph.facebook.com/v17.0/me?fields=id,name,picture`,
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
      `https://graph.facebook.com/v17.0/me/accounts`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );
    console.log(pages.data)
    res.json(pages.data);
  } catch (error) {
    console.error("Error fetching pages:", error.message);
    res.status(500).json({ error: "Failed to fetch pages" });
  }
});

// Fetch page insights
// app.get("/page-insights", async (req, res) => {
//   const { page_id, access_token, since, until } = req.query;

//   // Validate the required parameters
//   if (!page_id || !access_token) {
//     return res
//       .status(400)
//       .json({ error: "Missing required parameters: page_id or access_token" });
//   }

//   const validMetrics = [
//     "page_impressions",
//     "page_impressions_unique",
//     "page_engaged_users",
//     "page_fan_adds",
//     "page_views_total",
//   ];

//   try {
//     const insights = await axios.get(
//       `https://graph.facebook.com/v17.0/${page_id}/insights`,
//       {
//         params: {
//           metric: validMetrics.join(","), // Only using valid metrics
//           since: since || Math.floor(Date.now() / 1000 - 2592000), // Default to last 30 days
//           until: until || Math.floor(Date.now() / 1000), // Default to today
//           access_token,
//         },
//       }
//     );

//     console.log("Facebook Insights Response:", insights.data);

//     if (
//       !insights.data ||
//       !insights.data.data ||
//       insights.data.data.length === 0
//     ) {
//       return res
//         .status(404)
//         .json({ error: "No insights available for this page." });
//     }

//     res.json(insights.data);
//   } catch (error) {
//     console.error(
//       "Error fetching insights:",
//       error.response?.data || error.message
//     );
//     res
//       .status(500)
//       .json({
//         error: error.response?.data?.error?.message || "Internal server error",
//       });
//   }
// });
app.get("/page-insights", async (req, res) => {
  const { page_id, access_token, since, until } = req.query;

  if (!page_id || !access_token) {
    return res.status(400).json({ error: "Missing page_id or access_token" });
  }

  // Use only metrics confirmed to work
  const validMetrics = [
    "page_impressions",
    "page_impressions_unique",
    "page_engaged_users",
    "page_fan_adds",
    "page_views_total",
  ];

  try {
    const sinceTimestamp = since
      ? Math.floor(new Date(since).getTime() / 1000)
      : Math.floor(Date.now() / 1000 - 2592000);
    const untilTimestamp = until
      ? Math.floor(new Date(until).getTime() / 1000)
      : Math.floor(Date.now() / 1000);

    console.log("Fetching Insights:", {
      page_id,
      sinceTimestamp,
      untilTimestamp,
    });

    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${page_id}/insights`,
      {
        params: {
          metric: validMetrics.join(","),
          period: "day",
          since: sinceTimestamp,
          until: untilTimestamp,
          access_token,
        },
        validateStatus: false,
      }
    );

    if (response.status !== 200 || !response.data?.data) {
      console.error("Facebook API Error:", response.data);
      return res
        .status(response.status)
        .json({
          error:
            response.data?.error?.message ||
            "Invalid response from Facebook API",
        });
    }

    const transformedData = response.data.data.reduce((acc, metric) => {
      acc[metric.name] = metric.values;
      return acc;
    }, {});

    res.json({
      success: true,
      data: transformedData,
      timeRange: {
        since: new Date(sinceTimestamp * 1000).toISOString(),
        until: new Date(untilTimestamp * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching page insights:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
