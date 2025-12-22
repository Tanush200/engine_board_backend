const Event = require('../models/Event');

exports.createEvent = async (req, res) => {
    const { title, type, date, startTime, endTime, location, description, course } = req.body;
    try {
        const event = new Event({
            user: req.user.id,
            title,
            type,
            date,
            startTime,
            endTime,
            location,
            description,
            course: course || null
        });
        await event.save();

        await event.populate('course');
        res.status(201).json(event);
    } catch (error) {
        console.error(error.message);
        res.status(500).json('Server Error');
    }
};

exports.getEvents = async (req, res) => {
    try {
        const events = await Event.find({ user: req.user.id })
            .populate('course')
            .sort({ date: 1 });
        res.json(events);
    } catch (error) {
        console.error(error.message);
        res.status(500).json('Server Error');
    }
};

exports.getEvent = async (req, res) => {
    try {
        const event = await Event.findOne({
            _id: req.params.id,
            user: req.user.id
        }).populate('course');

        if (!event) return res.status(404).json({ message: 'Event Not Found' });
        res.json(event);
    } catch (error) {
        console.error(error.message);
        res.status(500).json('Server Error');
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { $set: req.body },
            { new: true }
        ).populate('course');

        if (!event) return res.status(404).json({ message: 'Event Not Found' });
        res.json(event);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete({
            _id: req.params.id,
            user: req.user.id,
        });

        if (!event) return res.status(404).json({ message: 'Event Not Found' });
        res.json({ message: 'Event Removed' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};

exports.getCalendarItems = async (req, res) => {
    try {
        const Task = require('../models/Task');

        const tasks = await Task.find({
            user: req.user.id,
            deadline: { $exists: true, $ne: null }
        }).populate('course');

        const events = await Event.find({ user: req.user.id }).populate('course');

        const calendarItems = [
            ...tasks.map(task => ({
                id: task._id,
                title: task.title,
                start: task.deadline,
                end: task.deadline,
                type: 'task',
                status: task.status,
                priority: task.priority,
                course: task.course,
                description: task.description,
                allDay: true
            })),
            ...events.map(event => {
                let start = new Date(event.date);
                let end = new Date(event.date);
                let allDay = true;

                if (event.startTime) {
                    const [hours, minutes] = event.startTime.split(':');
                    start.setHours(parseInt(hours), parseInt(minutes));
                    allDay = false;
                }

                if (event.endTime) {
                    const [hours, minutes] = event.endTime.split(':');
                    end.setHours(parseInt(hours), parseInt(minutes));
                } else if (!allDay) {
                    end = new Date(start.getTime() + 60 * 60 * 1000);
                }

                return {
                    id: event._id,
                    title: event.title,
                    start: start,
                    end: end,
                    type: event.type.toLowerCase(),
                    location: event.location,
                    course: event.course,
                    description: event.description,
                    startTime: event.startTime,
                    endTime: event.endTime,
                    allDay: allDay
                };
            })
        ];

        res.json(calendarItems);
    } catch (error) {
        console.error(error.message);
        res.status(500).json('Server Error');
    }
};
