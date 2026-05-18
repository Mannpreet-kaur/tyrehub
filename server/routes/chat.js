const express = require('express');
const { Anthropic } = require('@anthropic-ai/sdk');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { messages } = req.body; 
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // 🚀 Fallback Mock Mode for your Viva Demonstration!
    // If you don't put a real API key in the .env file, it will use these smart fake responses so your project demo still works perfectly!
    if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
      await new Promise(resolve => setTimeout(resolve, 1000)); // simulate typing delay
      
      const lastMsg = messages[messages.length - 1].content.toLowerCase();
      let reply = "I can definitely help with that! We have excellent tyres in stock. I recommend checking out our MRF and CEAT options on the Products page.";
      
      if (lastMsg.includes('price') || lastMsg.includes('cost') || lastMsg.includes('how much')) {
          reply = "Our tyre prices start from ₹1,150 for scooters and go up to ₹14,500 for heavy tractors. You can browse our catalogue for exact pricing!";
      } else if (lastMsg.includes('hello') || lastMsg.includes('hi') || lastMsg.includes('hey')) {
          reply = "Hello! I am the TyreHub AI Expert. How can I assist you with your vehicle's tyres today?";
      } else if (lastMsg.includes('car')) {
          reply = "For cars, the Apollo Amazer 4G Life or CEAT MILAZE X3 are fantastic choices for daily driving and great mileage.";
      }

      return res.json({ reply });
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const systemPrompt = "You are a helpful tyre expert assistant for TyreHub. Help customers choose the right tyres based on their vehicle type, budget, and driving conditions. Only answer tyre-related questions. If asked about non-tyre topics, politely redirect to tyres.";

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages,
    });

    res.json({ reply: response.content[0].text });
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: 'Failed to communicate with chat service.' });
  }
});

module.exports = router;
