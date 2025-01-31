import React, { useState } from "react";
import axios from "axios";

export const PageSelector = ({ accessToken, onPageSelect }) => {
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState("");

  const fetchPages = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/facebook/callback",
        {
          params: { access_token: accessToken },
        }
      );
      setPages(response.data.pages);
    } catch (error) {
      console.error("Error fetching pages", error);
    }
  };

  const handlePageSubmit = () => {
    onPageSelect(selectedPage);
  };

  return (
    <div>
      <select
        value={selectedPage}
        onChange={(e) => setSelectedPage(e.target.value)}
      >
        {pages.map((page) => (
          <option key={page.id} value={page.id}>
            {page.name}
          </option>
        ))}
      </select>
      <button onClick={handlePageSubmit}>Get Insights</button>
    </div>
  );
};
