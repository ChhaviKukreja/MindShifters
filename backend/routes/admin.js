const cors = require("cors");
const express = require("express");
const organiserMiddleware = require("../middleware/organiser");
const router = express.Router();
const { Organiser, Events, Tasks, Announcement, Feedback, Admin } = require("../db");
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

  router.get("/pending-requests", async (req, res) => {
    try {
      const admin = await Admin.findOne().populate("pendingRequests");
      res.json(admin.pendingRequests);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch pending requests" });
    }
  });
  
  // Approve event
  router.post("/approve/:eventId", async (req, res) => {
    const { eventId } = req.params;
  
    try {
      // Find and remove the event from the admin's pending list
      const admin = await Admin.findOne();
      admin.pendingRequests = admin.pendingRequests.filter(
        (id) => id.toString() !== eventId
      );
      await admin.save();
  
      // Add the event to the respective organizer's approved events
      const event = await Event.findById(eventId);
      const organizer = await Organiser.findOne({ orgEvent: eventId });
      if (organizer) {
        organizer.orgEvent.push(eventId);
        await organizer.save();
      }
  
      res.status(200).json({ message: "Event approved successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to approve event" });
    }
  });
  
  module.exports = router;