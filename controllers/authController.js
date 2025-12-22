const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


exports.register = async (req, res) => {
    const { name, email, password, collage, branch, year } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        user = new User({ name, email, password, collage, branch, year });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err
            res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email } })
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error')

    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: 'Invalid Credintials' });

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) return res.status(400).json({ message: "Invalid Credintials" });

        const payload = { user: { id: user.id } };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            res.status(200).json({ token, user: { id: user.id, name: user.name, githubAccessToken: user.githubAccessToken } })
        })

    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
}

exports.updateProfile = async (req, res) => {
    try {
        const { githubAccessToken } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ message: "User not found" });

        if (githubAccessToken !== undefined) {
            user.githubAccessToken = githubAccessToken;
        }

        await user.save();
        res.json({ message: "Profile updated successfully", user: { id: user.id, name: user.name, email: user.email, githubAccessToken: user.githubAccessToken } });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
};