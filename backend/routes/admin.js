const cors = require("cors");
const express = require("express");
const adminMiddleware = require("../middleware/admin");
const router = express.Router();
const { Organiser, Events, Tasks, Announcement, Feedback, Admin, NewSchema } = require("../db");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const { z } = require("zod");
router.use(cors());

const signupSchema = z.object({
    username: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must have at least 6 characters")
  });
  
  const signinSchema = z.object({
    username: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must have at least 6 characters"),
  });

  const eventSchema = z.object({
    event: z.string().nonempty("Event name is required"),
    location: z.string().nonempty("Location is required"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
    stuCoord: z.array(
      z.object({
        name: z.string().nonempty("Student coordinator name is required"),
        contact: z
          .string()
          .nonempty("Contact number is required"),
        email: z.string().email("Invalid email address"),
      })
    ),
    time: z.string().nonempty("Time is required"),
    description: z.string().optional(), // Optional description field
    imageURL: z.string().url("Invalid image URL").optional(), // Optional URL for image
    googleForm: z.string().url("Invalid image URL").optional()
  });
  
  router.post("/signup", async function (req, res) {
  
    try {
      const { username, password } = signupSchema.parse(req.body);
  
      const existingAdmin = await Admin.findOne({ username });
      if (existingAdmin) {
        return res.status(400).json({ msg: "Admin already exists" });
      }
  
      await Admin.create({ username, password });
      const token = jwt.sign({ username }, JWT_SECRET);
  
      res.json({ msg: "Admin created successfully", token: token });
  
    } catch (error) {
      res.status(400).json({ error: error.errors || error.message });
    }
  });
  
  router.post("/signin", async function (req, res) {
    try {
      const { username, password } = signinSchema.parse(req.body);
  
      const admin = await Admin.findOne({ username, password });
      if (admin) {
        const token = jwt.sign({ username }, JWT_SECRET);
        res.json({ token });
      } else {
        res.status(401).json({ msg: "Incorrect username or password" });
      }
    } catch (error) {
      res.status(400).json({ error: error.errors || error.message });
    }
  });
  
  router.get("/auth/check", adminMiddleware, (req, res) => {
    res.status(200).json({ username: req.username }); // Send back the authenticated user's details
  });

  router.get("/pending-requests", adminMiddleware, async (req, res) => {
    console.log("hello");
    try {
      const admin = await Admin.findOne().populate("pendingRequests");
      res.json(admin.pendingRequests);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch pending requests" });
    }
  });

  // Get counts of pending and approved events
router.get("/event-counts", adminMiddleware, async (req, res) => {
  try {
    const admin = await Admin.findOne().populate("pendingRequests");
    const pendingCount = admin.pendingRequests.length;

    res.status(200).json({
      pendingCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch event counts" });
  }
});

  
  // Approve event
router.post("/approve/:eventId", adminMiddleware, async (req, res) => {
  console.log("inside approve");
  const { eventId } = req.params;

  try {
    // Find and remove the event from the admin's pending list
    const admin = await Admin.findOne();
    console.log("Inside post", admin);
    admin.pendingRequests = admin.pendingRequests.filter(
      (id) => id.toString() !== eventId
    );
    await admin.save();

    //Add the event to the respective organizer's approved events
    const event = await Events.findById(eventId);
    console.log(event);
    const organizer = await Organiser.findOne({ dummyEvent: eventId });
    console.log(organizer);
    if (organizer) {
      organizer.orgEvent.push(eventId);
      organizer.dummyEvent = organizer.dummyEvent.filter(
        (id) => id.toString() !== eventId
      );
      await organizer.save();
    }

    res.status(200).json({ message: "Event approved successfully", eventId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to approve event" });
  }
});

router.get("/all-events", async (req, res) => {
  console.log("Route /all-events called");
  try {
    const events = await Events.find(); // Replace 'Event' with your actual event model name if different

    if (events.length === 0) {
      return res.status(404).json({ message: "No events found in the database" });
    }

    res.status(200).json({ events });
  } catch (error) {
    console.error("Error fetching all events:", error);
    res.status(500).json({ message: "Error fetching events", error });
  }
});

router.post("/approve-document/:eventId", adminMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Find the event
    const event = await Events.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Append admin signature to the letterhead
    event.letterhead += `
      <div style="margin-top: 20px; text-align: right;">
        <p>Approved by: [Admin Name]</p>
        <p>Signature: ___________________</p>
      </div>
    `;
    event.approved = true;
    await event.save();

    res.status(200).json({ message: "Document approved successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to approve document" });
  }
});

router.get("/view-letterhead/:eventId", adminMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Find the event
    const event = await Events.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Include the admin's name
    const adminName =  req.username ; // Replace with actual admin's name if dynamic

    // Return the letterhead along with the admin name
    res.status(200).json({
      letterhead: event.letterhead, // The generated letterhead HTML
      adminName: adminName,         // Admin's name
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch letterhead" });
  }
});

// router.get("/letterhead/:eventId", async (req, res) => {
//   try {
//     const { eventId } = req.params;
//     const event = await Event.findById(eventId);

//     if (!event || !event.letterhead) {
//       return res.status(404).json({ message: "Letterhead not found" });
//     }

//     res.json({ letterhead: event.letterhead });
//   } catch (error) {
//     console.error("Error fetching letterhead:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// Sign letterhead and approve event
router.post("/sign/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Logic to mark the event as approved
    event.status = "Approved"; // Assuming you have a status field
    await event.save();

    res.json({ message: "Event approved successfully" });
  } catch (error) {
    console.error("Error signing letterhead:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


  module.exports = router;
