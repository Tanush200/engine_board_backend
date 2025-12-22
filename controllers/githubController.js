const axios = require('axios');
const User = require('../models/User');


const getGithubHeaders = (token) => ({
    headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
    }
});

exports.getCommits = async (req, res) => {
    try {
        let { owner, repo } = req.params;

        repo = repo.replace(/\.git$/, '');

        console.log(`Fetching commits for ${owner}/${repo} by user ${req.user.id}`);

        const user = await User.findById(req.user.id);

        if (!user) {
            console.error(`User ${req.user.id} not found`);
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.githubAccessToken) {
            console.log(`User ${req.user.id} has no GitHub token`);
            return res.status(400).json({ message: "GitHub token not found. Please add it in your profile." });
        }

        const url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`;
        console.log(`Calling GitHub API: ${url}`);

        const response = await axios.get(url, getGithubHeaders(user.githubAccessToken));

        const commits = response.data.map(commit => ({
            sha: commit.sha,
            message: commit.commit.message,
            author: commit.commit.author.name,
            date: commit.commit.author.date,
            url: commit.html_url
        }));

        console.log(`Successfully fetched ${commits.length} commits`);
        res.json(commits);
    } catch (error) {
        console.error("GitHub API Error:", error.response?.data || error.message);
        console.error("Error details:", {
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url
        });

        if (error.response?.status === 404) {
            return res.status(404).json({ message: "Repository not found or access denied." });
        }
        if (error.response?.status === 401) {
            return res.status(401).json({ message: "Invalid GitHub token." });
        }
        res.status(500).json({ message: "Failed to fetch commits", error: error.message });
    }
};

exports.getRepoDetails = async (req, res) => {
    try {
        let { owner, repo } = req.params;

        repo = repo.replace(/\.git$/, '');

        console.log(`Fetching repo details for ${owner}/${repo} by user ${req.user.id}`);

        const user = await User.findById(req.user.id);

        if (!user) {
            console.error(`User ${req.user.id} not found`);
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.githubAccessToken) {
            console.log(`User ${req.user.id} has no GitHub token`);
            return res.status(400).json({ message: "GitHub token not found." });
        }

        const url = `https://api.github.com/repos/${owner}/${repo}`;
        console.log(`Calling GitHub API: ${url}`);

        const response = await axios.get(url, getGithubHeaders(user.githubAccessToken));

        const repoData = {
            name: response.data.name,
            full_name: response.data.full_name,
            description: response.data.description,
            stars: response.data.stargazers_count,
            forks: response.data.forks_count,
            open_issues: response.data.open_issues_count,
            url: response.data.html_url
        };

        console.log(`Successfully fetched repo details for ${repoData.full_name}`);
        res.json(repoData);
    } catch (error) {
        console.error("GitHub API Error:", error.response?.data || error.message);
        console.error("Error details:", {
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url
        });

        if (error.response?.status === 404) {
            return res.status(404).json({ message: "Repository not found or access denied." });
        }
        if (error.response?.status === 401) {
            return res.status(401).json({ message: "Invalid GitHub token." });
        }
        res.status(500).json({ message: "Failed to fetch repo details", error: error.message });
    }
};
