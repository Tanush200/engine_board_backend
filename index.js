const express = require("express");
const dotenv = require("dotenv");
dotenv.config(); // Load env vars immediately


const connectDB = require("./config/db");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const errorHandler = require("./middleware/error");

const authRoutes = require('./routes/auth')
const taskRoutes = require('./routes/tasks')
const courseRoutes = require('./routes/courses')
const eventRoutes = require('./routes/events')
const githubRoutes = require('./routes/github')
const studyPlanRoutes = require('./routes/studyPlans')
const aiChatRoutes = require('./routes/aiChat')
const streakRoutes = require('./routes/streaks')
const projectRoutes = require('./routes/projects')
const noteRoutes = require('./routes/notes')
const resourceRoutes = require('./routes/resources')

const app = express();

connectDB()

// Security Middleware
app.use(helmet());

// Logging Middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);

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
app.use('/api/notes', noteRoutes)
app.use('/api/resources', resourceRoutes)

// Error Handler (must be last)
app.use(errorHandler);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));