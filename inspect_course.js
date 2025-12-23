const mongoose = require('mongoose');
const Course = require('./models/Course');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const StudyPlan = require('./models/StudyPlan');

const inspectCourse = async () => {
    await connectDB();
    try {
        const courseId = '69499bc39cf50c0e77cdc1ff';
        const course = await Course.findById(courseId);
        if (!course) {
            console.log('Course not found');
        } else {
            console.log('Course Name:', course.name);
            console.log('Syllabus Length:', course.syllabus.length);
        }

        const plan = await StudyPlan.findOne({ course: courseId, status: 'active' });
        if (plan) {
            console.log('Active Plan Found');
            console.log('Total Days:', plan.schedule.length);
            console.log('Topics Covered:', JSON.stringify(plan.schedule.map(d => d.topics.map(t => t.name)), null, 2));
        } else {
            console.log('No Active Plan Found');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.disconnect();
    }
};

inspectCourse();
