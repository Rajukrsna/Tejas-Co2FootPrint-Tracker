const express = require('express');
const router = express.Router();
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();
const SAMBANOVA_API_KEY = process.env.SAMBANOVA_API_KEY?.trim();
const SAMBANOVA_API_URL = "https://api.sambanova.ai/v1";

router.post('/chat2', async (req, res) => {
    const { userMessage } = req.body;
     
    if (!userMessage) {
        return res.status(400).json({ error: 'Message is required.' });
    }

    if (!SAMBANOVA_API_KEY) {
        console.error("SAMBANOVA_API_KEY is not defined. Please set it in the .env file.");
        return res.status(500).json({ error: "Server configuration error" });
    }

    try {
        const response = await axios.post(
            `${SAMBANOVA_API_URL}/chat/completions`,
            {
                model: 'Meta-Llama-3.1-8B-Instruct',
                messages: [
                    { role: "system", content: "You are a helpful assistant" },
                    { role: "user", content: userMessage }
                ],
                temperature: 0.1,
                top_p: 0.1
            },
            {
                headers: {
                    Authorization: `Bearer ${SAMBANOVA_API_KEY}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) {
        console.error("SambaNova API call failed:", error.response?.data || error.message);

        res.status(500).json({ 
            error: "Failed to get response from the bot.",
            details: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
});

module.exports = router;
