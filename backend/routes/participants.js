const cors = require("cors");
const express = require("express");
const participantMiddleware = require("../middleware/participants");
const router = express.Router();
// const WebSocket = require('ws');
// const wss = new WebSocket.Server({ port: 3000 });
// const http = require('http');
// const server = http.createServer(router);
// server.on('upgrade', handleWebSocket);
const { Organiser, Events, Tasks, Participants, Announcement, Feedback } = require("../db");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const { z } = require("zod");
const PDFDocument = require('pdfkit');
const fs = require('fs');
router.use(cors());

const signupSchema = z.object({
    username: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must have at least 6 characters"),
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

        const existingParticipants = await Participants.findOne({ username });
        if (existingParticipants) {
            return res.status(400).json({ msg: "Participant already exists" });
        }

        await Participants.create({ username, password });
        const token = jwt.sign({ username }, JWT_SECRET);

        res.json({ msg: "Participant created successfully", token: token });

    } catch (error) {
        res.status(400).json({ error: error.errors || error.message });
    }
});

router.post("/signin", async function (req, res) {
    try {
        const { username, password } = signinSchema.parse(req.body);

        const participants = await Participants.findOne({ username, password });
        if (participants) {
            const token = jwt.sign({ username }, JWT_SECRET);
            res.json({ token });
        } else {
            res.status(401).json({ msg: "Incorrect username or password" });
        }
    } catch (error) {
        res.status(400).json({ error: error.errors || error.message });
    }
});

router.get("/auth/check", participantMiddleware, (req, res) => {
    res.status(200).json({ username: req.username }); // Send back the authenticated user's details
});

router.get("/all-events", async (req, res) => {
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

router.post("/register", participantMiddleware, async (req, res) => {
    const { eventId } = req.body; // Extract eventId from req.body
    // const username = req.username; // Extract username from middleware
  
    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }
  
    try {
      const event = await Events.findById(eventId); // Query database for the event
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }  
      const participant = await Participants.findOne({ username: req.username });
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }
  
      if (participant.regEvent.includes(eventId)) {
        return res.status(400).json({ message: "Already registered for this event" });
      }

  
      participant.regEvent.push(eventId);

      //await participant.save();
    //   const result = await participant.save();
    //   console.log('Save result:', result);
    await participant.save().catch(err => {
        console.error('Save error:', err);
        res.status(500).json({ message: 'Error saving participant' });
      });
      

  
      res.status(200).json({ message: "Successfully registered!" });
    } catch (error) {
      console.error("Error registering:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  router.get('/reg-events', participantMiddleware, async (req, res) => {
    //const username = req.username; // Extract username from JWT
  
    try {
      // Find the participant based on the username
      const participant = await Participants.findOne({ username: req.username }).populate('regEvent');
      if (!participant) {
        return res.status(404).json({ message: 'Participant not found' });
      }
  
      // Get the list of events the participant has registered for
      console.log("hello1")
      const events = participant.regEvent;

      if (events.length === 0) {
        return res.status(200).json({ message: 'No events registered', events: [] });
      }
      console.log("hello")
      return res.status(200).json({ events: events});

    } catch (error) {
      console.error('Error fetching events:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

//   router.get('/', (req, res) => {
//     res.send('Participant route');
// });

// let clients = [];

// // Handle WebSocket connection
// wss.on('connection', (ws) => {
//     clients.push(ws);

//     ws.on('close', () => {
//         clients = clients.filter(client => client !== ws);
//     });

//     ws.on('error', (error) => {
//         console.error('WebSocket Error:', error);
//     });
// });

// // Middleware to integrate WebSocket with Express server
// server.on('upgrade', (req, socket, head) => {
//     wss.handleUpgrade(req, socket, head, (ws) => {
//         wss.emit('connection', ws, req);
//     });
// });
// router.post('/send-announcement', (req, res) => {
//     const { title, message } = req.body;

//     if (!title || !message) {
//         return res.status(400).json({ error: 'Title and message are required' });
//     }

//     const announcement = JSON.stringify({ title, message });

//     clients.forEach(client => {
//         if (client.readyState === WebSocket.OPEN) {
//             client.send(announcement);
//         }
//     });

//     console.log('Announcement sent:', announcement);
//     res.json({ success: true, message: 'Announcement sent successfully!' });
// });
router.get('/part-announcements', async (req, res) => {
    try {
        const event = req.query.event;
        console.log(event);
        if (!event) {
            return res.status(400).json({ error: "Event name is required" });
        }

        const announcements = await Announcement.find({ eventName: event }).sort({ date: -1 });
        console.log(announcements);
        res.status(200).json({ announcements });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/feedback', async (req, res) => {
    try {
        const feedback = new Feedback(req.body);
        await feedback.save();
        res.status(201).json(feedback);
    } catch (error) {
        res.status(500).json({ error: 'Failed to submit feedback' });
    }
});

router.get('/chats/:eventId', async (req, res) => {
    try {
      const { eventId } = req.params;
      const messages = await Chat.find({ eventId }).sort({ timestamp: 1 });
      res.json(messages);
    } catch (error) {
      res.status(500).send('Error fetching messages');
    }
  });
  
  // Send a new message
router.post('/chats', async (req, res) => {
    try {
      const { eventId, sender, message } = req.body;
      const newMessage = new Chat({ eventId, sender, message });
      await newMessage.save();
      res.status(201).json(newMessage);
    } catch (error) {
      res.status(500).send('Error saving message');
    }
  });

// router.get('/generate-certificate', (req, res) => {
//     const { name, email } = req.query;

//     if (!name || !email) {
//         return res.status(400).send('Name and email are required.');
//     }

//     // Create a new PDF document
//     const doc = new PDFDocument();

//     // Set response headers
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename=${name}-certificate.pdf`);

//     // Write PDF content
//     doc.fontSize(24).text('Certificate of Completion', { align: 'center' });
//     doc.moveDown();
//     doc.fontSize(18).text(`This certifies that ${name}`, { align: 'center' });
//     doc.text('has successfully completed the event.', { align: 'center' });
//     doc.moveDown();
//     doc.fontSize(14).text(`Email: ${email}`, { align: 'center' });
//     doc.moveDown(2);
//     doc.text('Congratulations!', { align: 'center' });

//     // End the document and send it as the response
//     doc.pipe(res);
//     doc.end();
// });

module.exports = router;
