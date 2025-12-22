const Resource = require('../models/Resource');

// Seed Data
const SEED_RESOURCES = [
    {
        title: "Neso Academy",
        url: "https://www.youtube.com/@nesoacademy",
        description: "Comprehensive engineering tutorials covering Digital Electronics, Computer Organization, Data Structures, and more.",
        category: "Computer Science",
        tags: ["Digital Electronics", "COA", "Data Structures", "Algorithms"],
        thumbnail: "https://yt3.googleusercontent.com/ytc/AIdro_nK_hCqW_J8_q_q_q_q_q_q_q_q_q_q_q_q_q_q=s176-c-k-c0x00ffffff-no-rj"
    },
    {
        title: "Gate Smashers",
        url: "https://www.youtube.com/@GateSmashers",
        description: "Excellent resource for GATE preparation, OS, DBMS, and Computer Networks explanations in Hindi/English.",
        category: "Computer Science",
        tags: ["OS", "DBMS", "CN", "GATE"],
        thumbnail: "https://yt3.googleusercontent.com/ytc/AIdro_nK_hCqW_J8_q_q_q_q_q_q_q_q_q_q_q_q_q_q=s176-c-k-c0x00ffffff-no-rj"
    },
    {
        title: "Abdul Bari",
        url: "https://www.youtube.com/@abdul_bari",
        description: "Legendary algorithms and data structures explanations. A must-watch for any CS student.",
        category: "Computer Science",
        tags: ["Algorithms", "Data Structures", "C++"],
        thumbnail: "https://yt3.googleusercontent.com/ytc/AIdro_nK_hCqW_J8_q_q_q_q_q_q_q_q_q_q_q_q_q_q=s176-c-k-c0x00ffffff-no-rj"
    },
    {
        title: "3Blue1Brown",
        url: "https://www.youtube.com/@3blue1brown",
        description: "Beautifully animated math explanations. Perfect for understanding Linear Algebra and Calculus concepts intuitively.",
        category: "Mathematics",
        tags: ["Linear Algebra", "Calculus", "Visualization"],
        thumbnail: "https://yt3.googleusercontent.com/ytc/AIdro_nK_hCqW_J8_q_q_q_q_q_q_q_q_q_q_q_q_q_q=s176-c-k-c0x00ffffff-no-rj"
    },
    {
        title: "freeCodeCamp.org",
        url: "https://www.youtube.com/@freecodecamp",
        description: "Massive library of full courses on Web Development, Python, Java, Machine Learning, and more.",
        category: "Computer Science",
        tags: ["Web Dev", "Python", "Java", "Coding"],
        thumbnail: "https://yt3.googleusercontent.com/ytc/AIdro_nK_hCqW_J8_q_q_q_q_q_q_q_q_q_q_q_q_q_q=s176-c-k-c0x00ffffff-no-rj"
    },
    {
        title: "Michel van Biezen",
        url: "https://www.youtube.com/@MichelvanBiezen",
        description: "Thousands of lectures on Physics, Chemistry, Astronomy, and Math. Great for general engineering subjects.",
        category: "Physics",
        tags: ["Physics", "Mechanics", "Chemistry", "Math"],
        thumbnail: "https://yt3.googleusercontent.com/ytc/AIdro_nK_hCqW_J8_q_q_q_q_q_q_q_q_q_q_q_q_q_q=s176-c-k-c0x00ffffff-no-rj"
    },
    {
        title: "CodeWithHarry",
        url: "https://www.youtube.com/@CodeWithHarry",
        description: "Top-tier coding tutorials in Hindi. Covers Web Dev, Python, C, Java, and Android.",
        category: "Computer Science",
        tags: ["Hindi", "Web Dev", "Python", "C"],
        thumbnail: "https://yt3.googleusercontent.com/ytc/AIdro_nK_hCqW_J8_q_q_q_q_q_q_q_q_q_q_q_q_q_q=s176-c-k-c0x00ffffff-no-rj"
    },
    {
        title: "Professor Leonard",
        url: "https://www.youtube.com/@ProfessorLeonard",
        description: "The best Calculus lectures on the internet. Covers Calc 1, 2, 3 and Differential Equations.",
        category: "Mathematics",
        tags: ["Calculus", "Differential Equations", "Math"],
        thumbnail: "https://yt3.googleusercontent.com/ytc/AIdro_nK_hCqW_J8_q_q_q_q_q_q_q_q_q_q_q_q_q_q=s176-c-k-c0x00ffffff-no-rj"
    }
];

exports.getResources = async (req, res) => {
    try {
        const { search, category } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }

        if (category && category !== 'All') {
            query.category = category;
        }

        // If DB is empty, seed it first
        const count = await Resource.countDocuments();
        if (count === 0) {
            await Resource.insertMany(SEED_RESOURCES);
        }

        const resources = await Resource.find(query).sort({ title: 1 });
        res.json(resources);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.seedResources = async (req, res) => {
    try {
        await Resource.deleteMany({});
        await Resource.insertMany(SEED_RESOURCES);
        res.json({ message: "Resources seeded successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
