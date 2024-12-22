const API_URL = "http://localhost:3000/organiser"; // Replace with your server's URL
const express = require('express');
const bodyParser = require('body-parser');
const cors = require("cors");
const app = express();
app.use(cors());

// Handle sign-in form submission
const element = document.getElementById("signin-form").addEventListener("submit", async (event) => {
  event.preventDefault(); // Prevent the default form submission

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch(`${API_URL}/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Save the token in localStorage
      localStorage.setItem("token", data.token);
      alert("Sign-in successful!");

      // Redirect to the dashboard
      window.location.href = "new.html";
    } else {
      throw new Error(data.msg || "Sign-in failed");
    }
  } catch (error) {
    console.error("Sign-in error:", error.message);
    alert(error.message);
  }
});
