const Project = require('../models/Project');

// @desc    Get all projects for a user
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(projects);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
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

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res) => {
    const { title, description, domain, techStack, githubUrl, liveUrl, status, isPublic } = req.body;

    // Build project object
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

        // Make sure user owns project
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

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = async (req, res) => {
    try {
        let project = await Project.findById(req.params.id);

        if (!project) return res.status(404).json({ msg: 'Project not found' });

        // Make sure user owns project
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
