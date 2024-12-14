// Function to toggle the sidebar visibility
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const main = document.querySelector('.main');
    const image = document.querySelector('.fixed-image');
  
    // Toggle the 'hidden' class for the sidebar
    sidebar.classList.toggle('hidden');
  
    // Adjust the margin of the main content based on sidebar visibility
    if (sidebar.classList.contains('hidden')) {
      main.style.marginLeft = '0'; // Remove margin when sidebar is hidden
      image.style.left = '50%'; // Keep image centered
    } else {
      main.style.marginLeft = '270px'; // Restore margin when sidebar is visible
      image.style.left = 'calc(50% + 135px )'; // Adjust the image's position considering sidebar width (270px)
    }
  }
  
  function togglePanel(id) {
    const content = document.getElementById(id);
  
    if (content.classList.contains("active")) {
      // Apply slide-up animation and remove after complete
      content.classList.remove("active");
      content.classList.add("closing");
  
      // Wait for animation to finish before hiding
      content.addEventListener(
        "animationend",
        () => {
          content.style.display = "none";
          content.classList.remove("closing");
        },
        { once: true }
      );
    } else {
      // Show the content with slide-down animation
      content.style.display = "block";
      content.classList.add("active");
    }
  }
  
  function setActive(element) {
    // Remove the 'active' class from all sidebar items
    const items = document.querySelectorAll('.sidebar ul li');
    items.forEach((item) => {
      item.classList.remove('active');
    });
  
    // Add the 'active' class to the clicked item
    element.classList.add('active');
  }
  
  function exportTableData() {
    // Collect data from the table
    const rows = document.querySelectorAll("table tbody tr");
    let exportData = "SL,Event ID,Event,Location,Date,Created By,Created On,Last Submission\n";
  
    rows.forEach(row => {
      const cells = row.querySelectorAll("td");
      const rowData = Array.from(cells).map(cell => cell.innerText).join(",");
      exportData += rowData + "\n";
    });
  
    // Create a Blob with the data
    const blob = new Blob([exportData], { type: "text/csv" });
  
    // Create a hidden download link
    const link = document.createElement("a");
    link.style.display = "none"; // Prevent styling interference
    link.href = URL.createObjectURL(blob);
    link.download = "event_data.csv";
  
    // Append link to the body, trigger download, and clean up
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }