// api/chat.js - Enhanced with GPT-4 Vision for bill uploads

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, uploadedFile } = req.body;

    // Get OpenAI API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('OpenAI API key not found in environment variables');
      return res.status(500).json({ 
        error: 'API configuration error. Please contact support.' 
      });
    }

    let apiMessages = [];

    // System prompt for solar assistant
    const systemPrompt = {
      role: 'system',
      content: `You are a helpful solar energy expert assistant for AstroSolar, a Victorian solar and battery installation company. 

Key Information:
- Victorian electricity rates average $0.28/kWh
- Feed-in tariff: $0.05/kWh
- Solar rebates: Up to $1,400 in STCs available
- Average Victorian home uses 15-25 kWh/day
- Popular systems: 6.6kW solar + 13.5kWh battery (Tesla Powerwall 3)
- ROI typically 3-5 years
- Bill savings: Up to 90% reduction

When analyzing electricity bills:
1. Extract quarterly cost
2. Calculate daily usage if shown
3. Recommend appropriate solar system size
4. Estimate annual savings
5. Suggest battery storage benefits

Provide accurate, friendly advice. Keep responses concise. Always encourage users to get a personalized quote for exact pricing.`
    };

    // Handle uploaded bill image
    if (uploadedFile) {
      // If there's an uploaded file (base64 image), use GPT-4 Vision
      apiMessages = [
        systemPrompt,
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'I\'ve uploaded my electricity bill. Please analyze it and tell me: 1) My quarterly cost, 2) My daily usage if visible, 3) What solar system size you recommend, 4) Estimated annual savings with solar + battery.'
            },
            {
              type: 'image_url',
              image_url: {
                url: uploadedFile // base64 image data
              }
            }
          ]
        }
      ];
    } else {
      // Regular text chat
      apiMessages = [systemPrompt, ...messages];
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: uploadedFile ? 'gpt-4o' : 'gpt-4o-mini', // Use gpt-4o for vision, gpt-4o-mini for text
        messages: apiMessages,
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return res.status(response.status).json({ 
        error: 'Failed to get AI response. Please try again.' 
      });
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    return res.status(200).json({ 
      message: assistantMessage,
      usage: data.usage // Optional: track token usage
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ 
      error: 'An unexpected error occurred. Please try again.' 
    });
  }
}
