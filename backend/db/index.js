require('dotenv').config();
const mongoose=require("mongoose");

const mongoUri = process.env.MONGO_URI;
mongoose.connect(mongoUri);

const adminSchema = new mongoose.Schema({
    username: String,
    password: String,
    pendingRequests: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Events"
    }]
  });

const organiserSchema=new mongoose.Schema({
    username:String,
    password:String,
    orgEvent: [{
        type:mongoose.Schema.Types.ObjectID,
        ref:"Events"
    }]
}) 

const eventSchema=new mongoose.Schema({
    event:String,
    location:String,
    date:Date,
    stuCoord:[{
        name:String,
        contact:Number,
        email:String
    }], //name,no,email
    time:String,
    description:String,
    imageURL:String,
    googleForm:String
})

const participantSchema=new mongoose.Schema({
    username:String,
    password:String,
    regEvent: [{
        type:mongoose.Schema.Types.ObjectID,
        ref:"Events"
    }]
}) 

const TaskSchema = new mongoose.Schema({
    taskName: { type: String, required: true },
    eventName: { type: String, required: true },
    priority: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
    responsiblePersons: [{ type: String, required: true }],
    status: { type: String, enum: ['Not Started', 'In Progress', 'Completed'], required: true },
    dueDate: { type: Date, required: true },
    tags: [{ type: String }],
    subtasks: [
        {
            title: { type: String, required: true },
            isCompleted: { type: Boolean, default: false },
        }
    ],
    notes: { type: String }
});

const announcementSchema = new mongoose.Schema({
    eventName: String,
    title: String,
    content: String,
    date: { type: Date, default: Date.now },
  });

const feedbackSchema = new mongoose.Schema({
    name: String,
    event: String,
    rating: String,
    message: String,
    createdAt: { type: Date, default: Date.now },
});

const chatSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, required: true },
    sender: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  });
  
const Announcement = mongoose.model('Announcement', announcementSchema);
const Organiser=mongoose.model("Organiser",organiserSchema);
const Events=mongoose.model("Events",eventSchema);
const Participants=mongoose.model("Participants",participantSchema);
const Tasks = mongoose.model("Tasks",TaskSchema);
const Feedback = mongoose.model("Feedback", feedbackSchema);
const Chat = mongoose.model('Chat', chatSchema);
const Admin = mongoose.model("Admin", adminSchema);

module.exports={
    Organiser,
    Events,
    Participants,
    Tasks,
    Announcement,
    Feedback,
    Chat,
    Admin
}

