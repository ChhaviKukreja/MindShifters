# Event Management Portal

## Overview
The Event Management Portal is a comprehensive web-based application designed to streamline the process of organizing and participating in events. The platform supports three types of users: **Admin**, **Organizer**, and **Participant**, each with distinct roles and functionalities. By leveraging modern web technologies, the portal simplifies event management tasks such as approvals, announcements, feedback collection, and certificate distribution, while providing an intuitive user experience.

---

## Features

### **Admin Dashboard**
- **Event Approval**: Admins can review and approve events submitted by organizers. Once approved, these events are displayed as ongoing events in the organizer dashboard.
- **Digital Signature for Forms** (Future Scope): Streamline the process of obtaining multiple signatures for event-related forms. This feature eliminates the need to physically locate approvers by enabling digital signatures directly through the admin dashboard.

---

### **Organizer Dashboard**
- **Add Event**: Organizers can create new events. Approved events are displayed as ongoing events.
- **To-Do List**: Manage tasks by adding event-specific tasks and subtasks. These tasks are displayed in the "Assigned Tasks" container.
- **Broadcast Announcements**: Send announcements to participants of specific events.
- **Received Feedbacks**: View feedback provided by participants for events.
- **Calendar Integration**: View organized events displayed on a calendar for better event tracking.
- **View All Events**: Browse all events organized by various organizers.

---

### **Participant Dashboard**
- **Upcoming Events**: View all upcoming events and register for them.
- **Registered Events**: Track events in which the participant is registered.
- **Notifications**: Real-time announcements from organizers using polling for updates.
- **Group Chats**: Chat with other participants registered for the same event.
- **Feedback Form**: Submit feedback for events, which will be visible in the organizer dashboard.
- **Download Certificates**: Download certificates of successfully attended events.
- **Calendar Integration**: View registered and attended events displayed on a calendar.

---

## Tech Stack

### **Frontend**
- **HTML**: Structure and content of the web pages.
- **CSS**: Styling and responsive design.
- **JavaScript**: Interactive and dynamic user interface.

### **Backend**
- **Node.js**: Server-side runtime for building scalable backend services.
- **Express.js**: Framework for handling routing and middleware.
- **MongoDB**: NoSQL database for storing user and event data.

---

## Setup Instructions

### Prerequisites
- Node.js installed on your machine
- MongoDB installed locally or access to a MongoDB cloud database

### Steps to Run Locally
1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```bash
   cd MindShifters
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up environment variables:
   - Create a `.env` file in the root directory.
   - Add the following variables:
     ```env
     PORT=3000
     MONGO_URI=<your-mongodb-connection-string>
     JWT_SECRET=<your-jwt-secret>
     ```
5. Start the development server:
   ```bash
   npm start
   ```
6. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## Folder Structure
```
Mindshifters/
├── backend/
│   ├── db/
│   ├── middleware/
│   ├── routes/
│   ├── .env
│   ├── config.js
│   ├── index.js
│   ├── package.json
│   ├── package-lock.json
│   ├── vercel.json
│   └── .gitignore
├── frontend/
│   ├── admin/
│   ├── organiser/
│   ├── participant/
│   ├── config.js
│   ├── pro.jpg
│   ├── sign-in.html
│   ├── signup.html
│   └── vercel.json
├── .vercel/
├── .vscode/
├── .gitignore
├── README.md
└── package.json
```

---

## Future Enhancements
- Implementing the digital signature feature for admin approval of event forms.
- Adding analytics and insights for organizers to monitor event performance.
- Enhancing the real-time capabilities of notifications and group chats.

---

## Acknowledgments
- Thanks to the open-source community for providing resources and inspiration.
- Special thanks to the development team for their hard work and dedication.

---

## Contributing
Contributions are welcome! Feel free to raise issues, suggest features, or submit pull requests.



