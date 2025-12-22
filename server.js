const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const dotenv = require("dotenv");

const authRoutes = require('./routes/auth')
const taskRoutes = require('./routes/tasks')
const courseRoutes = require('./routes/courses')
const eventRoutes = require('./routes/events')
const githubRoutes = require('./routes/github')

dotenv.config();
const app = express();

connectDB()

app.use(express.json());
app.use(cors());

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/github', githubRoutes)


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));