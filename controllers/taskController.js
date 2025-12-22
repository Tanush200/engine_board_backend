const Task = require('../models/Task')

exports.createTask = async (req, res) => {
    const { title, description, course, type, status, priority, deadline, githubRepo } = req.body;

    try {
        const task = new Task({
            user: req.user.id,
            title,
            description,
            course: course || null,
            type: type || 'Assignment',
            status: status || 'Todo',
            priority: priority || 'Medium',
            deadline: deadline || null,
            githubRepo: githubRepo || ''
        });

        await task.save();
        res.status(201).json(task)
    } catch (error) {
        console.error(error.message);
        res.status(500).json('Server Error')
    }
};


exports.getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 }).populate('course')
        res.json(tasks)
    } catch (error) {
        console.error(error.message);
        res.status(500).json('Server Error')
    }
};


exports.updateTasks = async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { $set: req.body },
            { new: true }
        );
        if (!task) return res.status(404).json({ message: 'Task Not Found' });
        res.json(task)
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
}



exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete({
            _id: req.params.id,
            user: req.user.id,
        });

        if (!task) return res.status(404).json({ message: 'Task not Found' });
        res.json({ message: 'Task Removed' })
    } catch (error) {

    }
}