const express = require('express');
const bodyParser = require('body-parser');
const cors = require("cors");
const app = express();
const organiserRouter = require('./routes/organiser');
const participantRouter = require('./routes/participants');
const adminRouter = require('./routes/admin');
// const { server } = require("./routes/websocketServer");
// const { Events } = require("./db");
app.use(cors({
    origin: "https://mind-shifters-f.vercel.app",
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type']
  }));
//const userRouter = require('./routes/user');
app.use(express.json());
app.use(bodyParser.json());
app.use("/organiser", organiserRouter);
app.use("/participants", participantRouter);
app.use("/admin", adminRouter);
//app.use("/user", userRouter);
// app.get('/health', async function(req,res){
//     try {
//     console.log("healthy");
//     const events = await Events.find(); 
//     console.log(events);
//     res.status(200).json({ events });
//     console.log("healthy");
//     }  catch (error) {
//         console.error("Error fetching all events:", error);
//         res.status(500).json({ message: "Error fetching events", error });
//       }
// })
module.exports = app;

// const PORT = 3000;
// server.on('request', app);
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });