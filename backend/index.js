const express = require('express');
const bodyParser = require('body-parser');
const cors = require("cors");
const app = express();
const organiserRouter = require('./routes/organiser');
const participantRouter = require('./routes/participants');
app.use(cors());
//const userRouter = require('./routes/user');

app.use(bodyParser.json());
app.use("/organiser", organiserRouter);
app.use("/participants", participantRouter);
//app.use("/user", userRouter);

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});