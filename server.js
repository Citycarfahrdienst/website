const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const axios = require('axios');
const app = express();
const port = 3000;

// Gemini API configuration
const GEMINI_API_KEY = 'AIzaSyDs1WquHLOg1F6NVR02caXXAqw9a6HnDjI';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));
app.use(express.json());

// Endpoint to execute curl command
app.post('/execute-curl', (req, res) => {
    const { command } = req.body;
    
    // Execute the curl command
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing curl command: ${error}`);
            return res.status(500).json({ error: error.message });
        }
        
        if (stderr) {
            console.error(`Curl command stderr: ${stderr}`);
        }
        
        try {
            // Try to parse the response as JSON
            const jsonResponse = JSON.parse(stdout);
            res.json(jsonResponse);
        } catch (parseError) {
            console.error(`Error parsing curl response: ${parseError}`);
            res.status(500).json({ error: 'Invalid JSON response from API' });
        }
    });
});

// Endpoint to analyze event with Gemini
app.post('/analyze-event', async (req, res) => {
    const { event } = req.body;
    
    try {
        // Construct the prompt for Gemini
        const prompt = `As a financial analyst, analyze this economic event and provide a single word recommendation (BUY or SELL) based on the actual vs forecast values:
        Event: ${event.name}
        Country: ${event.countryCode}
        Currency: ${event.currencyCode}
        Actual: ${event.actual}
        Forecast: ${event.consensus}
        Previous: ${event.previous}
        Volatility: ${event.volatility}
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

        res.json({ recommendation });
    } catch (error) {
        console.error('Error analyzing event with Gemini:', error);
        res.status(500).json({ error: 'Failed to analyze event' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 