const Note = require('../models/Note');

exports.getNotes = async (req, res) => {
    try {
        const notes = await Note.find({ user: req.user.id, isArchived: false }).sort({ updatedAt: -1 });
        res.json(notes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.createNote = async (req, res) => {
    try {
        const { content, color, position } = req.body;
        const newNote = new Note({
            user: req.user.id,
            content,
            color,
            position
        });
        const note = await newNote.save();
        res.json(note);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateNote = async (req, res) => {
    try {
        const { content, color, position, isArchived } = req.body;
        let note = await Note.findById(req.params.id);

        if (!note) return res.status(404).json({ msg: 'Note not found' });
        if (note.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        if (content !== undefined) note.content = content;
        if (color !== undefined) note.color = color;
        if (position !== undefined) note.position = position;
        if (isArchived !== undefined) note.isArchived = isArchived;

        await note.save();
        res.json(note);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteNote = async (req, res) => {
    try {
        let note = await Note.findById(req.params.id);

        if (!note) return res.status(404).json({ msg: 'Note not found' });
        if (note.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        await Note.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Note removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
