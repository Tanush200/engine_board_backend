const Course = require('../models/Course');

exports.createCourse = async (req, res) => {
    const { name, code, professor, semester, color } = req.body;
    try {
        const course = new Course({
            user: req.user.id,
            name,
            code,
            professor,
            semester,
            color
        });
        await course.save();
        res.status(201).json(course);
    } catch (error) {
        console.error(error.message);
        res.status(500).json('Server Error');
    }
};

exports.getCourses = async (req, res) => {
    try {
        const courses = await Course.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(courses);
    } catch (error) {
        console.error(error.message);
        res.status(500).json('Server Error');
    }
};

exports.getCourse = async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.id,
            user: req.user.id
        });
        if (!course) return res.status(404).json({ message: 'Course Not Found' });
        res.json(course);
    } catch (error) {
        console.error(error.message);
        res.status(500).json('Server Error');
    }
};

exports.updateCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { $set: req.body },
            { new: true }
        );
        if (!course) return res.status(404).json({ message: 'Course Not Found' });
        res.json(course);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete({
            _id: req.params.id,
            user: req.user.id,
        });
        if (!course) return res.status(404).json({ message: 'Course not Found' });
        res.json({ message: 'Course Removed' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

exports.addSyllabusTopic = async (req, res) => {
    try {
        const { topic } = req.body;
        const course = await Course.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!course) return res.status(404).json({ message: 'Course Not Found' });

        course.syllabus.push({ topic, completed: false });
        await course.save();
        res.json(course);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

exports.toggleSyllabusTopic = async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!course) return res.status(404).json({ message: 'Course Not Found' });

        const topicItem = course.syllabus.id(req.params.topicId);
        if (!topicItem) return res.status(404).json({ message: 'Topic Not Found' });

        topicItem.completed = !topicItem.completed;
        await course.save();
        res.json(course);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

exports.addResource = async (req, res) => {
    try {
        const { title, link, type } = req.body;
        const course = await Course.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!course) return res.status(404).json({ message: 'Course Not Found' });

        course.resources.push({ title, link, type: type || 'Link' });
        await course.save();
        res.json(course);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteResource = async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!course) return res.status(404).json({ message: 'Course Not Found' });

        course.resources.id(req.params.resourceId).remove();
        await course.save();
        res.json(course);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

exports.updateAttendance = async (req, res) => {
    try {
        const { attended, total } = req.body;
        const course = await Course.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!course) return res.status(404).json({ message: 'Course Not Found' });

        course.attendance.attended = attended;
        course.attendance.total = total;
        await course.save();
        res.json(course);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};