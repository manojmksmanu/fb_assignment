import React, { useState } from "react";
import FacebookLogin from "react-facebook-login";
import axios from "axios";

const App = () => {
  const [user, setUser] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState("");
  const [insights, setInsights] = useState(null);

  const responseFacebook = async (response) => {
    setUser(response);
    const { accessToken } = response;
    try {
     const pagesRes = await axios.get(
       `https://fb-assignment.onrender.com/pages?access_token=${accessToken}`
     );

      setPages(pagesRes.data.data);
    } catch (error) {
      console.error("Error fetching pages:", error);
    }
  };

  const fetchInsights = async () => {
    if (!selectedPage) return;
    const { accessToken } = user;
    try {
     const insightsRes = await axios.get(
       `https://fb-assignment.onrender.com/page-insights?page_id=${selectedPage}&access_token=${accessToken}`
     );
      setInsights(insightsRes.data.data);
    } catch (error) {
      console.error("Error fetching insights:", error);
    }
  };

  return (
    <div>
      {!user ? (
        <FacebookLogin
          appId="914299164196328"
          fields="name,picture"
          callback={responseFacebook}
          redirectUri="https://fb-assignment.onrender.com/callback"
        />
      ) : (
        <div>
          <h2>Welcome, {user.name}</h2>
          <img src={user.picture.data.url} alt="Profile" />
          <select onChange={(e) => setSelectedPage(e.target.value)}>
            <option value="">Select a Page</option>
            {pages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.name}
              </option>
            ))}
          </select>
          <button onClick={fetchInsights}>Get Insights</button>
          {insights && (
            <div>
              <h3>Insights</h3>
              {insights.map((metric) => (
                <p key={metric.id}>
                  {metric.name}: {metric.values[0].value}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
