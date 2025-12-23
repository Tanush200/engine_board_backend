const Task = require('../models/Task');
const Course = require('../models/Course');

/**
 * Calculate study streaks for a user
 * @param {string} userId 
 * @returns {Object} Streak data grouped by course
 */
const calculateStreaks = async (userId) => {
    try {
        // Get all completed tasks for the user, sorted by completion date (newest first)
        const completedTasks = await Task.find({
            user: userId,
            status: 'Done',
            completedAt: { $ne: null }
        }).populate('course').sort({ completedAt: -1 });

        // Group tasks by course
        const courseStreaks = {};
        const globalActivity = {}; // Map of date string -> boolean

        completedTasks.forEach(task => {
            const date = new Date(task.completedAt).toISOString().split('T')[0];
            globalActivity[date] = true;

            const courseName = task.course ? task.course.name : 'General';

            if (!courseStreaks[courseName]) {
                courseStreaks[courseName] = {
                    dates: new Set(),
                    currentStreak: 0,
                    lastActivity: null
                };
            }

            courseStreaks[courseName].dates.add(date);
            if (!courseStreaks[courseName].lastActivity) {
                courseStreaks[courseName].lastActivity = date;
            }
        });

        // Calculate streaks for each course
        const result = {};
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        Object.keys(courseStreaks).forEach(course => {
            const data = courseStreaks[course];
            const dates = Array.from(data.dates).sort().reverse(); // Newest first

            let streak = 0;
            let currentCheckDate = new Date();

            // Check if streak is active (studied today or yesterday)
            const lastStudied = dates[0];
            const isActive = lastStudied === today || lastStudied === yesterday;

            if (isActive) {
                // Count backwards from the last studied date
                let checkDate = new Date(lastStudied);

                while (true) {
                    const dateStr = checkDate.toISOString().split('T')[0];
                    if (data.dates.has(dateStr)) {
                        streak++;
                        checkDate.setDate(checkDate.getDate() - 1);
                    } else {
                        break;
                    }
                }
            }

            // Generate last 5 days history
            const history = [];
            for (let i = 4; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                history.push({
                    date: dateStr,
                    completed: data.dates.has(dateStr)
                });
            }

            result[course] = {
                streak,
                isActive,
                lastStudied,
                history
            };
        });

        // Calculate global streak (across all courses)
        let globalStreak = 0;
        const sortedGlobalDates = Object.keys(globalActivity).sort().reverse();
        const lastGlobal = sortedGlobalDates[0];
        const isGlobalActive = lastGlobal === today || lastGlobal === yesterday;

        if (isGlobalActive) {
            let checkDate = new Date(lastGlobal);
            while (true) {
                const dateStr = checkDate.toISOString().split('T')[0];
                if (globalActivity[dateStr]) {
                    globalStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        return {
            global: {
                streak: globalStreak,
                isActive: isGlobalActive
            },
            courses: result
        };

    } catch (error) {
        console.error('Error calculating streaks:', error);
        throw error;
    }
};

module.exports = {
    calculateStreaks
};
