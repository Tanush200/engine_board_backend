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

        let searchTerm = query;
        let aiSummary = null;

        // Use Perplexity AI if key is available and query is detailed enough (e.g., > 3 words)
        if (process.env.PERPLEXITY_API_KEY && query.split(' ').length > 3) {
            try {
                const aiResponse = await axios.post('https://api.perplexity.ai/chat/completions', {
                    model: 'llama-3.1-sonar-small-128k-online',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful study assistant. The user will give you a detailed study topic or question. Your job is to: 1. Generate a concise, optimized search query for finding educational YouTube videos on this topic. 2. Provide a brief, 2-sentence summary or explanation of the core concept. Return the response as a JSON object with keys: "optimizedQuery" and "summary".'
                        },
                        {
                            role: 'user',
                            content: query
                        }
                    ],
                    temperature: 0.2
                }, {
                    headers: {
                        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });

                const content = aiResponse.data.choices[0].message.content;
                // Attempt to parse JSON from the response. It might be wrapped in markdown code blocks.
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    searchTerm = parsed.optimizedQuery || query;
                    aiSummary = parsed.summary;
                }
            } catch (aiError) {
                console.error('Perplexity API error:', aiError.message);
            }
        }

        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                maxResults: 12,
                q: `${searchTerm} tutorial education`,
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

        res.json({
            videos,
            summary: aiSummary,
            originalQuery: query,
            optimizedQuery: searchTerm
        });

    } catch (error) {
        console.error('Error searching YouTube:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Error fetching resources from YouTube' });
    }
};
