// add-event.js
const API_URL = "http://localhost:3000/organiser"; // Replace with your server's URL
const token = localStorage.getItem("token");

// Redirect to sign-in if no token is found
if (!token) {
  alert("Please sign in to add an event.");
  window.location.href = "signin.html";
}

// Handle form submission
document.querySelector(".event-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = {    
    event: document.querySelector("#event-name").value,
    date: document.querySelector("#date").value,
    time: document.querySelector("#time").value,
    location: document.querySelector("#location").value,
    stuCoord: [
      {
        name: document.querySelector("#student-coordinator").value,
        number: "1234567890", // Replace this with actual input if available
        email: "example@example.com", // Replace this with actual input if available
      },
    ],
    imageLink: "https://via.placeholder.com/150", // Replace with actual input
    description: "Event Description", // Replace with actual input
    regLink: "https://example.com/register", // Replace with actual input
    SL: Math.floor(Math.random() * 1000), // Generate random SL
  };

  try {
    const response = await fetch(`${API_URL}/eventReg`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) throw new Error("Failed to add event");

    alert("Event added successfully!");
    window.location.href = "new.html"; // Redirect to dashboard
  } catch (err) {
    console.error(err);
    alert("Error adding event.");
  }
});
