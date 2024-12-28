require('dotenv').config();
const mongoose=require("mongoose");

const mongoUri = process.env.MONGO_URI;
mongoose.connect(mongoUri);

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
    imageURL:String
})

const participantSchema=new mongoose.Schema({
    username:String,
    password:String,
    regEvent: [{
        type:mongoose.Schema.Types.ObjectID,
        ref:"Events"
    }]
}) 

const Organiser=mongoose.model("Organiser",organiserSchema);
const Events=mongoose.model("Events",eventSchema);
const Participants=mongoose.model("Participants",participantSchema);

module.exports={
    Organiser,
    Events,
    Participants
}

