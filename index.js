const express = require("express");
const dotenv = require("dotenv");
dotenv.config(); // Load env vars immediately

const connectDB = require("./config/db");
const cors = require("cors");

const authRoutes = require('./routes/auth')
const taskRoutes = require('./routes/tasks')
const courseRoutes = require('./routes/courses')
const eventRoutes = require('./routes/events')
const githubRoutes = require('./routes/github')
const studyPlanRoutes = require('./routes/studyPlans')
const aiChatRoutes = require('./routes/aiChat')
const streakRoutes = require('./routes/streaks')
const projectRoutes = require('./routes/projects')

const app = express();

connectDB()

app.use(express.json());
app.use(
    cors({
        origin:
            process.env.NODE_ENV === "production"
                ? ["https://engine-board-frontend.vercel.app"]
                : ["http://localhost:3000"],
        credentials: true,
    })
);


app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/github', githubRoutes)
app.use('/api/study-plans', studyPlanRoutes)
app.use('/api/ai-chat', aiChatRoutes)
app.use('/api/streaks', streakRoutes)
app.use('/api/projects', projectRoutes)


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));