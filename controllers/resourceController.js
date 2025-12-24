const axios = require('axios');

exports.searchResources = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        if (!process.env.YOUTUBE_API_KEY) {
            console.error('YOUTUBE_API_KEY is missing in environment variables');
            return res.status(500).json({ message: 'Server configuration error: API Key missing' });
        }

        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                maxResults: 12,
                q: `${query} tutorial education`,
                type: 'video',
                key: process.env.YOUTUBE_API_KEY,
                relevanceLanguage: 'en',
                videoEmbeddable: 'true'
            }
        });

        const videos = response.data.items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt
        }));

        res.json(videos);

    } catch (error) {
        console.error('Error searching YouTube:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Error fetching resources from YouTube' });
    }
};
