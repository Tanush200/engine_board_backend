require('dotenv').config();
const axios = require('axios');

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

console.log('Testing Perplexity API with correct model...');
console.log('API Key loaded:', PERPLEXITY_API_KEY ? `${PERPLEXITY_API_KEY.substring(0, 10)}...` : 'NOT FOUND');

async function testAPI() {
    try {
        const response = await axios.post(
            'https://api.perplexity.ai/chat/completions',
            {
                model: 'sonar-pro',
                messages: [
                    { role: 'user', content: 'Say hello in one sentence!' }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('\n✅ SUCCESS! API is working perfectly.');
        console.log('AI Response:', response.data.choices[0].message.content);
        console.log('\n🎉 Your AI Study Buddy is ready to use!');
    } catch (error) {
        console.error('\n❌ ERROR:');
        console.error('Status:', error.response?.status);
        console.error('Error:', error.response?.data);
    }
}

testAPI();
