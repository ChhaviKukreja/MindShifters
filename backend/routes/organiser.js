// Updated organiser.js with Zod validation, improved functionality, and dedicated to-do list management
const cors = require("cors");
const express = require("express");
const organiserMiddleware = require("../middleware/organiser");
const router = express.Router();
const { Organiser, Events, Tasks, Announcement, Feedback, Admin } = require("../db");
//const http = require('http');
//const WebSocket = require('ws');
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const { z } = require("zod");
// const server = http.createServer(router);
//const wss = new WebSocket.Server({ server });
// console.log(require.resolve('./websocketServer'));
// const path = require('path');
// console.log('Resolved path for websocketServer.js:', path.resolve('./websocketServer'));
// const { broadcast } = require("../../../websocketServer");


router.use(cors());

// Zod schemas
const TaskValidationSchema = z.object({
  taskName: z.string().min(1, { message: "Task name is required." }),
  eventName: z.string().min(1, { message: "Event name is required." }),
  priority: z.enum(['High', 'Medium', 'Low'], { message: "Invalid priority level." }),
  responsiblePersons: z.array(z.string()).nonempty({ message: "At least one responsible person is required." }),
  status: z.enum(['Not Started', 'In Progress', 'Completed'], { message: "Invalid status." }),
  dueDate: z.string(),
  tags: z.array(z.string()).optional(),
  subtasks: z.array(
    z.object({
      title: z.string().min(1, { message: "Subtask title is required." }),
      isCompleted: z.boolean().optional(),
    })
  ).optional(),
  notes: z.string().optional()
});

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



const todoSchema = z.object({
  task: z.string().nonempty("Task description is required"),
  completed: z.boolean().default(false),
});

// Routes
router.post("/signup", async function (req, res) {
  
  try {
    const { username, password } = signupSchema.parse(req.body);

    const existingOrganiser = await Organiser.findOne({ username });
    if (existingOrganiser) {
      return res.status(400).json({ msg: "Organiser already exists" });
    }

    await Organiser.create({ username, password });
    const token = jwt.sign({ username }, JWT_SECRET);

    res.json({ msg: "Organiser created successfully", token: token });

  } catch (error) {
    res.status(400).json({ error: error.errors || error.message });
  }
});

router.post("/signin", async function (req, res) {
  try {
    const { username, password } = signinSchema.parse(req.body);

    const organiser = await Organiser.findOne({ username, password });
    if (organiser) {
      const token = jwt.sign({ username }, JWT_SECRET);
      res.json({ token });
    } else {
      res.status(401).json({ msg: "Incorrect username or password" });
    }
  } catch (error) {
    res.status(400).json({ error: error.errors || error.message });
  }
});

router.get("/auth/check", organiserMiddleware, (req, res) => {
  res.status(200).json({ username: req.username }); // Send back the authenticated user's details
});

router.post("/eventReg", organiserMiddleware, async function (req, res) {
  try {
    // Parse and create the event
    const eventData = eventSchema.parse(req.body);
    const newEvent = await Events.create(eventData);

    // Log event creation details
    console.log("Event created:", newEvent);

    // Retrieve username from request (set by middleware)
    const username = req.username;
    const eventId = newEvent._id;

    console.log("Updating organiser:", username, "with event ID:", eventId);

    const admin = await Admin.findOne();
    const updateAdmin=await Admin.updateOne(
      { "$push": { pendingRequests: eventId } }
    );
    

    //Update the organiser's orgEvent array
    const updateResult = await Organiser.updateOne(
      { username: username },
      { "$push": { dummyEvent: eventId } }
    );

    // Log the result of the update
    console.log("Update result:", updateResult);

    if (updateResult.nModified === 0) {
      throw new Error("Failed to update organiser with the new event.");
    }

    res.json({ msg: "Event created successfully", eventId: eventId });
  } catch (error) {
    console.error("Error during event registration:", error);
    res.status(400).json({ error: error.errors || error.message });
  }
});


router.get("/orgEvents", organiserMiddleware, async function (req, res) {
  try {
    const organiser = await Organiser.findOne({ username: req.username }).populate("dummyEvent");
    if (!organiser)
      return res.status(404).json({ error: "Organiser not found" });
    res.json({ events: organiser.dummyEvent });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add a new event and send it for administrative approval
router.post("/add-event", organiserMiddleware, async (req, res) => {
  const { event, location, date, stuCoord, time, description, imageURL, googleForm } = req.body;

  try {
    // Create a new event document
    const newEvent = new Event({
      event,
      location,
      date,
      stuCoord,
      time,
      description,
      imageURL,
      googleForm,
    });

    // Save the new event
    const savedEvent = await newEvent.save();

    // Find the admin and add the new event to the pendingRequests
    const admin = await Admin.findOne();
    if (admin) {
      admin.pendingRequests.push(savedEvent._id);
      await admin.save();
    } else {
      return res.status(500).json({ message: "Admin not found to handle the request." });
    }

    // Add the event to the organizer's orgEvent list
    const organiser = await Organiser.findOne({ username: req.username });
    if (organiser) {
      organiser.orgEvent.push(savedEvent._id);
      await organiser.save();
    }

    res.status(201).json({ message: "Event created and sent for administrative approval.", event: savedEvent });
  } catch (error) {
    console.error("Error adding event:", error);
    res.status(500).json({ message: "Failed to create the event." });
  }
});


// Edit functionality
router.put("/editEvent/:id", organiserMiddleware, async function (req, res) {
  try {
    const eventId = req.params.id;
    const updatedData = eventSchema.partial().parse(req.body);

    const updatedEvent = await Events.findByIdAndUpdate(eventId, updatedData, {
      new: true,
    });

    if (!updatedEvent) {
      return res.status(404).json({ msg: "Event not found" });
    }

    res.json({ msg: "Event updated successfully", updatedEvent });
  } catch (error) {
    res.status(400).json({ error: error.errors || error.message });
  }
});

// Dedicated to-do list functionality
router.post("/addTodo", organiserMiddleware, async function (req, res) {
  try {
    const todoData = todoSchema.parse(req.body);
    await Organiser.updateOne(
      { username: req.username },
      { $push: { toDoList: todoData } }
    );

    res.json({ msg: "To-do task added successfully" });
  } catch (error) {
    res.status(400).json({ error: error.errors || error.message });
  }
});

router.get("/getTodos", organiserMiddleware, async function (req, res) {
  try {
    const organiser = await Organiser.findOne({ username: req.username });
    res.json({ toDoList: organiser.toDoList });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/updateTodo", organiserMiddleware, async function (req, res) {
  try {
    const { task, completed } = todoSchema.parse(req.body);
    const organiser = await Organiser.findOneAndUpdate(
      { username: req.username, "toDoList.task": task },
      { $set: { "toDoList.$.completed": completed } },
      { new: true }
    );

    if (!organiser) {
      return res.status(404).json({ msg: "Task not found" });
    }

    res.json({ msg: "To-do task updated successfully", toDoList: organiser.toDoList });
  } catch (error) {
    res.status(400).json({ error: error.errors || error.message });
  }
});

// Route to fetch events specific to an organiser
router.get("/events", organiserMiddleware, async (req, res) => {
  try {
    // Assuming req.username is set by authentication middleware

    const organiser = await Organiser.findOne({ username: req.username }).populate("orgEvent");

    if (!organiser) {
      return res.status(404).json({ message: "Organiser not found" });
    }

    const events = organiser.orgEvent;

    if (events.length === 0) {
      return res.status(404).json({ message: "No events found for this organiser" });
    }

    res.status(200).json({ events });
  } catch (error) {
    console.error("Error fetching organiser events:", error);
    res.status(500).json({ message: "Error fetching events", error });
  }
});

router.post("/tasks", async (req, res) => {
  try {
    // Validate incoming data
    const data = TaskValidationSchema.parse(req.body);

    // Find and update the task
    const updatedTask = await Tasks.create(data);

    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found." });
    }

    // Send response
    return res.status(200).json({ message: "Task updated successfully", task: updatedTask });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error updating task:", error);
    res.status(500).json({ error: "An error occurred while updating the task." });
  }
});


router.get("/tasks", async (req, res) => {
  try {
    // Extract event name from query parameters
    const event  = req.query.event;  // Extract 'event' from the query string

    if (!event) {
      return res.status(400).json({ error: "Event name is required" });
    }

    // Find tasks associated with the event
    const tasks = await Tasks.find({ eventName: event });  // Assuming the tasks have an 'eventName' field
    console.log("Found tasks:", tasks);

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ error: "No tasks found for this event." });
    }

    // Respond with the found tasks
    res.status(200).json( {tasks} );
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "An error occurred while fetching tasks." });
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

// // Store connected clients
// let clients = [];

// wss.on('connection', (ws) => {
//     console.log('A participant connected.');
//     clients.push(ws);

//     // Remove client when they disconnect
//     ws.on('close', () => {
//         clients = clients.filter((client) => client !== ws);
//         console.log('A participant disconnected.');
//     });

//     // Log received messages (optional)
//     ws.on('message', (data) => {
//         console.log(Received message: ${data});
//     });
// });

// // Route to broadcast announcements to all participants
// // router.post('/send-announcement', (req, res) => {
// //     const { title, message } = req.body;

// //     if (!title || !message) {
// //         return res.status(400).json({ error: 'Title and message are required' });
// //     }

// //     // Broadcast announcement to all connected clients
// //     const announcement = JSON.stringify({ title, message });
// //     clients.forEach((client) => {
// //         if (client.readyState === WebSocket.OPEN) {
// //             client.send(announcement);
// //         }
// //     });

// //     console.log('Announcement sent:', announcement);
// //     res.json({ success: true, message: 'Announcement sent successfully!' });
// // });

router.post('/send-announcement', (req, res) => {
  const { title, message } = req.body;

  if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
  }

  // Broadcast the announcement
  broadcast({ title, message });
  console.log('Announcement sent:', { title, message });

  res.json({ success: true, message: 'Announcement sent successfully!' });
});

router.post('/create-announcement', async (req, res) => {
  const { eventName, title, content } = req.body;

  try {
    const newAnnouncement = new Announcement({ eventName, title, content });
    await newAnnouncement.save();
    res.status(201).json(newAnnouncement);
  } catch (err) {
    res.status(500).json({ message: 'Error creating announcement', error: err.message });
  }
});

router.get('/announcements', async (req, res) => {
  try {
    const event  = req.query.event;  // Extract 'event' from the query string

    if (!event) {
      return res.status(400).json({ error: "Event name is required" });
    }
    
    const announcements = await Announcement.find({ eventName: event }).sort({ date: -1 });
    if (!announcements || announcements.length === 0) {
      return res.status(404).json({ error: "No announcements for this event" });
    }
    res.status(200).json( {announcements} );

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/feedback', async (req, res) => {
  try {
      const feedbacks = await Feedback.find().sort({ createdAt: -1 });
      res.status(200).json(feedbacks);
  } catch (error) {
      res.status(500).json({ error: 'Failed to fetch feedbacks' });
  }
});

// router.post("/generate-letterhead/:eventId", organiserMiddleware, async (req, res) => {
//   try {
//     const { eventId } = req.params;

//     // Fetch event details
//     const event = await Events.findById(eventId);
//     if (!event) {
//       return res.status(404).json({ message: "Event not found" });
//     }

//     // Create a new jsPDF instance
//     const doc = new jsPDF();

//     // Set font
//     doc.setFont("helvetica");

//     // Add content to PDF
//     doc.setFontSize(18);
//     doc.text("Permission Letter", 105, 30, null, null, "center");
    
//     doc.setFontSize(12);
//     doc.text(`Organized by: [College Name]`, 105, 40, null, null, "center");

//     doc.text(`Event Name: ${event.event}`, 20, 60);
//     doc.text(`Venue: ${event.location}`, 20, 70);
//     doc.text(`Date: ${new Date(event.date).toLocaleDateString()}`, 20, 80);
//     doc.text(`Time: ${event.time}`, 20, 90);

//     // Save the PDF to a file
//     const letterheadPath = path.join(__dirname, `../uploads/letterheads/${eventId}_letterhead.pdf`);
    
//     // Save the PDF to the file system
//     doc.save(letterheadPath);

//     // Optionally store the file path in your event document
//     event.letterhead = letterheadPath;
//     await event.save();

//     res.status(200).json({
//       message: "Letterhead generated successfully",
//       letterheadUrl: `/uploads/letterheads/${eventId}_letterhead.pdf`, // URL to download the letterhead
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Failed to generate letterhead" });
//   }
// });
// // Start the server

router.get('/event-details', async (req, res) => {
  const eventId = req.query.eventId;  // Get eventId from query parameter
  if (!eventId) {
    return res.status(400).send('Event ID is required');
  }

  try {
    const event = await Event.findById(eventId);  // Find event by ID
    if (!event) {
      return res.status(404).send('Event not found');
    }
    res.json(event);  // Send the event details as JSON response
  } catch (error) {
    res.status(500).send('Error fetching event details');
  }
});

router.post('/generate-letterhead', async (req, res) => {
  console.log("inside generate")
  const { eventName, letterhead } = req.body;
  console.log("boddy found", letterhead)

  // Validate the inputs
  if (!eventName || !letterhead) {
    return res.status(400).send('Event name and Letterhead URL are required.');
  }

  try {
    // Find the event by name
    const event = await Events.findOne({ event: eventName });

    if (!event) {
      return res.status(404).send('Event not found.');
    }
    console.log("event found", event)

    // Save the letterhead URL to the event
    event.letterhead = letterhead;
    await event.save();
    console.log("letterhead added")

    res.status(200).json({
      message: 'Letterhead URL saved successfully.',
      event,
    });
  } catch (error) {
    console.error('Error saving letterhead URL:', error);
    res.status(500).send('Internal Server Error.');
  }
});



module.exports = router;
