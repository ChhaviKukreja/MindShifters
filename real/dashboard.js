// Sidebar toggle
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const main = document.querySelector('.main-content');

  sidebar.classList.toggle('hidden');
  if (sidebar.classList.contains('hidden')) {
    main.style.marginLeft = '0';
  } else {
    main.style.marginLeft = '270px';
  }
}

// Panel toggle
function togglePanel(id) {
  const content = document.getElementById(id);
  content.classList.toggle('active');
}

// Backend API integration
const API_URL = "http://localhost:3000/organiser"; // Replace with your server's URL
const token = localStorage.getItem("token");

// Check if user is authenticated
if (!token) {
  alert("Please sign in to access the dashboard.");
  window.location.href = "signin.html"; // Redirect to sign-in page
}

// Fetch organizer events and display them
async function fetchEvents() {
  try {
    const response = await fetch(`${API_URL}/orgEvents`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch events");

    const data = await response.json();
    const tableBody = document.querySelector("tbody");

    tableBody.innerHTML = ""; // Clear existing rows
    data.events.forEach((event, index) => {
      const row = `
        <tr>
          <td>${index + 1}</td>
          <td>${event._id}</td>
          <td>${event.event}</td>
          <td>${event.location}</td>
          <td>${new Date(event.date).toLocaleString()}</td>
          <td>${event.createdBy || "N/A"}</td>
          <td>${new Date(event.createdOn).toLocaleDateString() || "N/A"}</td>
          <td><button onclick="editEvent('${event._id}')">✏️</button></td>
        </tr>`;
      tableBody.insertAdjacentHTML("beforeend", row);
    });
  } catch (err) {
    console.error(err);
    alert("Error fetching events.");
  }
}

// Navigate to "Add Event" page
function navigateToAddEvent() {
  window.location.href = "add-event.html";
}

// Function to handle editing an event (future functionality)
function editEvent(eventId) {
  alert(`Edit event functionality for ID: ${eventId} is not yet implemented.`);
  // Future: Navigate to an edit event page with pre-filled data
}

// Fetch events on page load
document.addEventListener("DOMContentLoaded", fetchEvents);

// Handle Add Event buttons
document.querySelectorAll(".btn-primary, .btn-secondary").forEach((button) => {
  button.addEventListener("click", navigateToAddEvent);
});
