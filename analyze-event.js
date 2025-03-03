const axios = require('axios');

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDs1WquHLOg1F6NVR02caXXAqw9a6HnDjI';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { event: economicEvent } = JSON.parse(event.body);
        
        // Construct the prompt for Gemini
        const prompt = `As a financial analyst, analyze this economic event and provide a single word recommendation (BUY or SELL) based on the actual vs forecast values:
        Event: ${economicEvent.name}
        Country: ${economicEvent.countryCode}
        Currency: ${economicEvent.currencyCode}
        Actual: ${economicEvent.actual}
        Forecast: ${economicEvent.consensus}
        Previous: ${economicEvent.previous}
        Volatility: ${economicEvent.volatility}
        Consider the impact on the currency and provide only one word: BUY or SELL`;

        // Call Gemini API
        const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            contents: [{
                parts: [{ text: prompt }]
            }]
        });

        // Extract the recommendation
        const recommendation = response.data.candidates[0].content.parts[0].text.trim().toUpperCase();
        
        // Validate the recommendation
        if (recommendation !== 'BUY' && recommendation !== 'SELL') {
            throw new Error('Invalid recommendation from Gemini API');
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({ recommendation })
        };
    } catch (error) {
        console.error('Error analyzing event with Gemini:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({ error: 'Failed to analyze event' })
        };
    }
}; 