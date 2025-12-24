const Project = require('../models/Project');


exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(projects);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};


exports.createProject = async (req, res) => {
    const { title, description, domain, techStack, githubUrl, liveUrl, status, isPublic } = req.body;

    try {
        const newProject = new Project({
            user: req.user.id,
            title,
            description,
            domain,
            techStack,
            githubUrl,
            liveUrl,
            status,
            isPublic
        });

        const project = await newProject.save();
        res.json(project);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};


exports.updateProject = async (req, res) => {
    const { title, description, domain, techStack, githubUrl, liveUrl, status, isPublic } = req.body;

    const projectFields = {};
    if (title) projectFields.title = title;
    if (description) projectFields.description = description;
    if (domain) projectFields.domain = domain;
    if (techStack) projectFields.techStack = techStack;
    if (githubUrl) projectFields.githubUrl = githubUrl;
    if (liveUrl) projectFields.liveUrl = liveUrl;
    if (status) projectFields.status = status;
    if (isPublic !== undefined) projectFields.isPublic = isPublic;

    try {
        let project = await Project.findById(req.params.id);

        if (!project) return res.status(404).json({ msg: 'Project not found' });

        if (project.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        project = await Project.findByIdAndUpdate(
            req.params.id,
            { $set: projectFields },
            { new: true }
        );

        res.json(project);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};


exports.deleteProject = async (req, res) => {
    try {
        let project = await Project.findById(req.params.id);

        if (!project) return res.status(404).json({ msg: 'Project not found' });

        if (project.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Project.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Project removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
