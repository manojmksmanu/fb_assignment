import React from "react";
import axios from "axios";

export const FacebookLogin = () => {
  const handleLogin = () => {
    window.location.href = "http://localhost:5000/api/facebook/login";
  };

  return <button onClick={handleLogin}>Login with Facebook</button>;
};
