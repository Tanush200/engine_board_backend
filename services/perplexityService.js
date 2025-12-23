const axios = require('axios');

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

/**
 * Helper function to make Perplexity API calls
 */
const callPerplexity = async (messages, model = 'sonar') => {
    try {
        const response = await axios.post(
            PERPLEXITY_API_URL,
            {
                model: model,
                messages: messages
            },
            {
                headers: {
                    'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Perplexity API Error:', error.response?.data || error.message);
        throw new Error('Failed to get AI response');
    }
};

/**
 * Generate topic dependencies for a course
 * Returns a dependency graph showing prerequisites for each topic
 */
const generateTopicDependencies = async (courseName, syllabusTopics) => {
    const messages = [
        {
            role: 'system',
            content: 'You are an expert educational AI that analyzes course syllabi and identifies topic dependencies. Return ONLY valid JSON without any markdown formatting or explanation.'
        },
        {
            role: 'user',
            content: `Analyze the following course and create a topic dependency graph.
            
Course: ${courseName}
Topics: ${syllabusTopics.join(', ')}

Create a JSON object where each topic maps to its prerequisites and metadata.
Format:
{
  "topicName": {
    "prerequisites": ["prerequisite1", "prerequisite2"],
    "difficulty": "beginner|intermediate|advanced",
    "estimatedHours": number,
    "description": "brief description"
  }
}

Return ONLY the JSON object, no other text.`
        }
    ];

    try {
        const response = await callPerplexity(messages);
        // Clean up response in case it has markdown code blocks
        const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleanResponse);
    } catch (error) {
        console.error('Failed to parse dependencies:', error);
        // Return basic structure if parsing fails
        return syllabusTopics.reduce((acc, topic) => {
            acc[topic] = {
                prerequisites: [],
                difficulty: 'intermediate',
                estimatedHours: 4,
                description: topic
            };
            return acc;
        }, {});
    }
};

/**
 * Generate a personalized study plan
 */
const generateStudyPlan = async (course, examDate, studentLevel, hoursPerDay) => {
    const today = new Date();
    const exam = new Date(examDate);
    const daysUntilExam = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));

    const messages = [
        {
            role: 'system',
            content: 'You are an expert study planner for engineering students. Create realistic, achievable study plans. Return ONLY valid JSON.'
        },
        {
            role: 'user',
            content: `Create a ${daysUntilExam}-day study plan for the following course:

Course: ${course.name}
Syllabus Topics: ${course.syllabus.map(s => s.topic).join(', ')}
Student Level: ${studentLevel}
Available Hours per Day: ${hoursPerDay}
Exam Date: ${examDate}

Create a day-by-day plan that:
1. Starts with fundamentals and builds up
2. Includes review sessions using spaced repetition
3. Allocates more time to difficult topics
4. Leaves the last day for final revision
5. MUST include ALL syllabus topics listed above. Do not skip any topics.

Return JSON in this format:
{
  "dailySchedule": [
    {
      "day": 1,
      "topics": [
        {
          "name": "Topic Name",
          "hoursAllocated": 2,
          "difficulty": "beginner|intermediate|advanced",
          "goalDescription": "What student should achieve"
        }
      ],
      "reviewTopics": ["Topic to review from previous days"],
      "totalHours": 4
    }
  ],
  "studyTips": ["Tip 1", "Tip 2"],
  "examStrategy": "Final day strategy"
}

Return ONLY the JSON object.`
        }
    ];

    try {
        const response = await callPerplexity(messages, 'sonar-pro');
        const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleanResponse);
    } catch (error) {
        console.error('Failed to generate study plan:', error);
        throw error;
    }
};

/**
 * Suggest adaptive plan adjustments based on progress
 */
const suggestAdaptivePlan = async (originalPlan, currentProgress, daysRemaining) => {
    const completedTopics = currentProgress.filter(t => t.completed).map(t => t.topic);
    const pendingTopics = currentProgress.filter(t => !t.completed).map(t => t.topic);
    const lowConfidenceTopics = currentProgress.filter(t => t.confidence < 3).map(t => t.topic);

    const messages = [
        {
            role: 'system',
            content: 'You are an adaptive study coach. Analyze student progress and suggest realistic plan adjustments. Return ONLY valid JSON.'
        },
        {
            role: 'user',
            content: `The student needs to adjust their study plan.

Days Remaining: ${daysRemaining}
Completed Topics: ${completedTopics.join(', ') || 'None'}
Pending Topics: ${pendingTopics.join(', ')}
Low Confidence Topics: ${lowConfidenceTopics.join(', ') || 'None'}

Suggest adjustments:
1. Which topics to prioritize
2. Which topics to skip or make optional
3. How to redistribute remaining time
4. Whether to focus on breadth or depth

Return JSON:
{
  "priorityTopics": ["Must complete"],
  "optionalTopics": ["Can skip if time runs out"],
  "adjustedSchedule": [
    {
      "day": 1,
      "topics": ["topic1", "topic2"],
      "hours": 4
    }
  ],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "confidenceBoost": ["How to improve low-confidence topics"]
}

Return ONLY the JSON object.`
        }
    ];

    try {
        const response = await callPerplexity(messages);
        const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleanResponse);
    } catch (error) {
        console.error('Failed to generate adaptive plan:', error);
        throw error;
    }
};

/**
 * Generate spaced repetition schedule for learned topics
 */
const getSpacedRepetitionSchedule = async (topicsLearned, examDate) => {
    const messages = [
        {
            role: 'system',
            content: 'You are an expert in spaced repetition learning. Create optimal review schedules. Return ONLY valid JSON.'
        },
        {
            role: 'user',
            content: `Create a spaced repetition review schedule for these topics:

Topics Learned: ${topicsLearned.map(t => `${t.name} (learned on ${t.learnedDate})`).join(', ')}
Exam Date: ${examDate}

Use intervals: 1 day, 3 days, 7 days for review sessions.

Return JSON:
{
  "reviewSchedule": [
    {
      "date": "2025-01-15",
      "topics": ["Topic 1", "Topic 2"],
      "reviewType": "quick|deep",
      "estimatedTime": 30
    }
  ]
}

Return ONLY the JSON object.`
        }
    ];

    try {
        const response = await callPerplexity(messages);
        const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleanResponse);
    } catch (error) {
        console.error('Failed to generate review schedule:', error);
        return { reviewSchedule: [] };
    }
};

module.exports = {
    generateTopicDependencies,
    generateStudyPlan,
    suggestAdaptivePlan,
    getSpacedRepetitionSchedule
};
