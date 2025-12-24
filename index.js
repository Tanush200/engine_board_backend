const express = require("express");
const http = require("http");
const { initSocket } = require("./socket/socketHandler");
const dotenv = require("dotenv");
dotenv.config(); // Load env vars immediately


const connectDB = require("./config/db");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const errorHandler = require("./middleware/error");
const checkPayment = require('./middleware/checkPayment');
const auth = require('./middleware/auth');

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
const paymentRoutes = require('./routes/paymentRoutes')

const app = express();

connectDB()


app.use(helmet());


if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    skip: (req) => req.method === 'OPTIONS'
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
app.use('/api/tasks', auth, checkPayment, taskRoutes)
app.use('/api/courses', auth, checkPayment, courseRoutes)
app.use('/api/events', auth, checkPayment, eventRoutes)
app.use('/api/github', auth, checkPayment, githubRoutes)
app.use('/api/study-plans', auth, checkPayment, studyPlanRoutes)
app.use('/api/ai-chat', auth, checkPayment, aiChatRoutes)
app.use('/api/streaks', auth, checkPayment, streakRoutes)
app.use('/api/projects', auth, checkPayment, projectRoutes)
app.use('/api/notes', auth, checkPayment, noteRoutes)
app.use('/api/resources', auth, checkPayment, resourceRoutes)
app.use('/api/payment', paymentRoutes)

app.use(errorHandler);


const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));