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

// Fetch page insights
// app.get("/page-insights", async (req, res) => {
//   const { page_id, access_token, since, until, period } = req.query;

//   if (!page_id || !access_token) {
//     return res.status(400).json({ error: "Missing page_id or access_token" });
//   }

//   const validMetrics = [
//     "page_fan_adds",
//     "page_views_total",
//     "page_impressions",
//   ];


//   try {

//         const sinceTimestamp = since
//           ? parseInt(since)
//           : Math.floor(Date.now() / 1000 - 7 * 24 * 60 * 60);
//         const untilTimestamp = until
//           ? parseInt(until)
//           : Math.floor(Date.now() / 1000);

//         const response = await axios.get(
//           `https://graph.facebook.com/v22.0/${page_id}/insights`,
//           {
//             params: {
//               metric: validMetrics.join(","),
//               period: period || "lifetime",
//               since: sinceTimestamp,
//               until: untilTimestamp,
//               access_token,
//             },
//           }
//         );

//     // Make sure we're sending the data array directly
//     res.json({
//       success: true,
//       data: response.data.data || [], // Ensure we always send an array
//       timeRange: {
//         since: new Date(sinceTimestamp * 1000).toISOString(),
//         until: new Date(untilTimestamp * 1000).toISOString(),
//       },
//     });
//   } catch (error) {
//     console.error("Detailed error:", {
//       message: error.message,
//       response: error.response?.data,
//     });

//     res.status(error.response?.status || 500).json({
//       error: "Error fetching insights",
//       details: error.response?.data || error.message,
//     });
//   }
// });



// app.get("/page-insights", async (req, res) => {
//   const { page_id, access_token, since, until } = req.query;

//   if (!page_id || !access_token) {
//     return res.status(400).json({ error: "Missing page_id or access_token" });
//   }

//   // Separate lifetime and daily metrics
//   const lifetimeMetrics = ["page_fans"]; // Only page_fans supports "lifetime"
//   const dailyMetrics = ["page_engaged_users", "page_impressions"]; // Requires "day" period

//   let selectedMetrics = lifetimeMetrics;
//   let params = { access_token };

//   if (since && until) {
//     const sinceInt = parseInt(since);
//     const untilInt = parseInt(until);

//     if (isNaN(sinceInt) || isNaN(untilInt) || sinceInt > untilInt) {
//       return res.status(400).json({ error: "Invalid date range provided" });
//     }

//     // Use "day" period for date range queries
//     selectedMetrics = dailyMetrics;
//     params.period = "day";
//     params.since = sinceInt;
//     params.until = untilInt;
//   } else {
//     // Use "lifetime" for default requests
//     params.period = "lifetime";
//   }

//   params.metric = selectedMetrics.join(",");

//   console.log(
//     `Requesting: https://graph.facebook.com/v22.0/${page_id}/insights`,
//     params
//   );

//   try {
//     const response = await axios.get(
//       `https://graph.facebook.com/v22.0/${page_id}/insights`,
//       { params }
//     );

//     if (!response.data || !response.data.data) {
//       return res
//         .status(400)
//         .json({ error: "Invalid response from Facebook API" });
//     }

//     let processedData = response.data.data;

//     if (since && until) {
//       // Sum up the daily values
//       processedData = response.data.data.map((metric) => ({
//         name: metric.name,
//         values: [
//           {
//             value: metric.values
//               .reduce((sum, item) => sum + (parseInt(item.value) || 0), 0)
//               .toString(),
//             end_time: new Date().toISOString(),
//           },
//         ],
//       }));
//     }

//     res.json({
//       success: true,
//       data: processedData,
//       isFiltered: !!(since && until),
//       timeRange:
//         since && until
//           ? {
//               since: new Date(sinceInt * 1000).toISOString(),
//               until: new Date(untilInt * 1000).toISOString(),
//             }
//           : null,
//     });
//   } catch (error) {
//     console.error(
//       "Error fetching insights:",
//       error.response?.data || error.message
//     );
//     res.status(error.response?.status || 500).json({
//       error: "Error fetching insights",
//       details: error.response?.data || error.message,
//     });
//   }
// });

app.get("/page-insights", async (req, res) => {
  const { page_id, access_token } = req.query;

  // Ensure that page_id and access_token are provided
  if (!page_id || !access_token) {
    return res.status(400).json({ error: "Missing page_id or access_token" });
  }

  // Define valid metrics that can be requested
  const validMetrics = [
    "page_fans", // Total fans
    "page_impressions", // Impressions
  ];

  // Construct query parameters to fetch insights
  let params = {
    access_token,
    metric: validMetrics.join(","), // Join the metrics into a comma-separated string
  };

  console.log(
    `Requesting: https://graph.facebook.com/v22.0/${page_id}/insights`
  );
  console.log("Request params:", params);

  try {
    // Make the request to the Facebook Graph API
    const response = await axios.get(
      `https://graph.facebook.com/v22.0/${page_id}/insights`,
      { params }
    );

    console.log("Facebook API Response:", response.data);

    // Check if response contains valid data
    if (
      !response.data ||
      !response.data.data ||
      response.data.data.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "No data available for the requested metrics" });
    }

    // Return the insights data as JSON in the expected format
    res.json({
      success: true,
      data: response.data.data.map((item) => ({
        ...item,
        // Example of how to modify the data structure
        title: item.title || item.name, // Ensuring title exists
        description: item.description || "", // Providing a fallback if description is missing
        values: item.values.map((value) => ({
          value: value.value,
          end_time: value.end_time,
        })),
      })),
      isFiltered: false, // No filters applied in this case
    });
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
