const Task = require('../models/Task');

exports.getStreakData = async (req, res) => {
    try {
        const completedTasks = await Task.find({
            user: req.user.id,
            status: 'Done'
        }).populate('course');

        const normalizeDate = (date) => {
            return new Date(date).toISOString().split('T')[0];
        };

        const tasksByDate = {};
        completedTasks.forEach(task => {
            const date = normalizeDate(task.completedAt || task.updatedAt || task.createdAt);
            if (!tasksByDate[date]) {
                tasksByDate[date] = [];
            }
            tasksByDate[date].push(task);
        });

        let currentStreak = 0;
        const today = normalizeDate(new Date());
        const yesterday = normalizeDate(new Date(Date.now() - 86400000));

        const isActive = !!tasksByDate[today] || !!tasksByDate[yesterday];

        let checkDate = new Date();
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

        const globalHistory = [];
        const todayDate = new Date();

        // We want 365 days
        for (let i = 364; i >= 0; i--) {
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

        const courseStreaks = {};

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

        Object.entries(tasksByCourse).forEach(([courseName, tasks]) => {
            tasks.sort((a, b) => new Date(b.completedAt || b.updatedAt) - new Date(a.completedAt || a.updatedAt));

            const courseTasksByDate = {};
            tasks.forEach(task => {
                const date = normalizeDate(task.completedAt || task.updatedAt || task.createdAt);
                courseTasksByDate[date] = true;
            });

            let streak = 0;
            let date = new Date();
            if (!courseTasksByDate[normalizeDate(date)]) {
                date.setDate(date.getDate() - 1);
            }

            while (courseTasksByDate[normalizeDate(date)]) {
                streak++;
                date.setDate(date.getDate() - 1);
            }

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
