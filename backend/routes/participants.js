const cors = require("cors");
const express = require("express");
const participantMiddleware = require("../middleware/participants");
const router = express.Router();
const { Organiser, Events, Tasks, Participants } = require("../db");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const { z } = require("zod");
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

// router.get("/events", participantMiddleware, async (req, res) => {
//     console.log("Route /events called");
//     try {
//       // Assuming `req.username` is set by authentication middleware
  
//       const organiser = await Participants.findOne({ username: req.username }).populate("orgEvent");
//       console.log("Organiser found");
  
//       if (!organiser) {
//         return res.status(404).json({ message: "Organiser not found" });
//       }
  
//       const events = organiser.orgEvent;
  
//       if (events.length === 0) {
//         return res.status(404).json({ message: "No events found for this organiser" });
//       }
  
//       res.status(200).json({ events });
//     } catch (error) {
//       console.error("Error fetching organiser events:", error);
//       res.status(500).json({ message: "Error fetching events", error });
//     }
//   });

//   router.post()

module.exports = router;