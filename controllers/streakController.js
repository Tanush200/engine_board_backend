const Task = require('../models/Task');

exports.getStreakData = async (req, res) => {
    try {
        // Get all completed tasks for the user
        const completedTasks = await Task.find({
            user: req.user.id,
            status: 'Done'
        }).populate('course');

        // Helper to normalize date to YYYY-MM-DD
        const normalizeDate = (date) => {
            return new Date(date).toISOString().split('T')[0];
        };

        // Group tasks by date
        const tasksByDate = {};
        completedTasks.forEach(task => {
            const date = normalizeDate(task.updatedAt || task.createdAt);
            if (!tasksByDate[date]) {
                tasksByDate[date] = [];
            }
            tasksByDate[date].push(task);
        });

        // Calculate Global Streak
        let currentStreak = 0;
        const today = normalizeDate(new Date());
        const yesterday = normalizeDate(new Date(Date.now() - 86400000));

        // Check if streak is active (completed task today or yesterday)
        const isActive = !!tasksByDate[today] || !!tasksByDate[yesterday];

        // Calculate streak count
        let checkDate = new Date();
        // If no task today, start checking from yesterday for the count
        if (!tasksByDate[today]) {
            checkDate.setDate(checkDate.getDate() - 1);
        }

        while (true) {
            const dateStr = normalizeDate(checkDate);
            if (tasksByDate[dateStr]) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        // Generate last 118 days history for global grid (approx 4 months to fill the grid nicely)
        // We want to start from a Sunday to align the grid properly if we use CSS grid auto-flow column
        // But for simplicity, let's just get the last 120 days
        const globalHistory = [];
        const todayDate = new Date();
        // Adjust to end on today

        for (let i = 118; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = normalizeDate(d);
            const tasksForDay = tasksByDate[dateStr] || [];
            globalHistory.push({
                date: dateStr,
                count: tasksForDay.length,
                completed: tasksForDay.length > 0
            });
        }

        // Calculate Course Streaks
        const courseStreaks = {};

        // Group tasks by course
        const tasksByCourse = {};
        completedTasks.forEach(task => {
            if (task.course) {
                const courseName = task.course.name;
                if (!tasksByCourse[courseName]) {
                    tasksByCourse[courseName] = [];
                }
                tasksByCourse[courseName].push(task);
            }
        });

        // Process each course
        Object.entries(tasksByCourse).forEach(([courseName, tasks]) => {
            // Sort tasks by date descending
            tasks.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

            const courseTasksByDate = {};
            tasks.forEach(task => {
                const date = normalizeDate(task.updatedAt || task.createdAt);
                courseTasksByDate[date] = true;
            });

            // Calculate streak for this course
            let streak = 0;
            let date = new Date();
            // Similar logic for course streak counting
            if (!courseTasksByDate[normalizeDate(date)]) {
                date.setDate(date.getDate() - 1);
            }

            while (courseTasksByDate[normalizeDate(date)]) {
                streak++;
                date.setDate(date.getDate() - 1);
            }

            // Generate last 14 days history
            const history = [];
            for (let i = 13; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = normalizeDate(d);
                history.push({
                    date: dateStr,
                    completed: !!courseTasksByDate[dateStr]
                });
            }

            courseStreaks[courseName] = {
                streak,
                isActive: !!courseTasksByDate[today] || !!courseTasksByDate[yesterday],
                history
            };
        });

        res.json({
            global: {
                streak: currentStreak,
                isActive,
                history: globalHistory
            },
            courses: courseStreaks
        });

    } catch (error) {
        console.error('Error fetching streak data:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
