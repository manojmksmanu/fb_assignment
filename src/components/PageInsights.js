
import React, { useState } from "react";
import axios from "axios";

export const PageInsights = ({ pageId, accessToken }) => {
  const [insights, setInsights] = useState(null);

  const fetchPageInsights = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/facebook/page-insights",
        {
          params: { pageId, accessToken },
        }
      );
      setInsights(response.data.data);
    } catch (error) {
      console.error("Error fetching page insights", error);
    }
  };

  return (
    <div>
      {insights &&
        insights.map((insight) => (
          <div key={insight.name}>
            <h3>{insight.title}</h3>
            <p>Value: {insight.values[0].value}</p>
          </div>
        ))}
    </div>
  );
};