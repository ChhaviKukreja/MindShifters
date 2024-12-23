// Updated organiser.js with Zod validation, improved functionality, and dedicated to-do list management
const cors = require("cors");
const express = require("express");
const organiserMiddleware = require("../middleware/organiser");
const router = express.Router();
const { Organiser, Events } = require("../db/index");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const { z } = require("zod");
router.use(cors());

// Zod schemas
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
  stuCoord: z.string().nonempty("Name required"),
  //time: z.string().nonempty("Time is req"),
  price: z.number().positive(),
  staffCoordinator: z.string().nonempty("Name required")
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
    
    res.json({ msg: "Organiser created successfully" , token: token});

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

    // Update the organiser's orgEvent array
    const updateResult = await Organiser.updateOne(
      { username: username },
      { "$push": { orgEvent: eventId } }
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
    const organiser = await Organiser.findOne({ username: req.username }).populate("orgEvent");
    if (!organiser)
      return res.status(404).json({ error: "Organiser not found" });
    res.json({ events: organiser.orgEvent });
  } catch (error) {
    res.status(400).json({ error: error.message });
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

module.exports = router;
