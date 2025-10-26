// worker.js - Cloudflare Worker for Permaculture AI API
export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    try {
      const url = new URL(request.url);
      
      // Route handling
      if (url.pathname === '/api/ask' && request.method === 'POST') {
        return await handleAsk(request, env, corsHeaders);
      } else if (url.pathname === '/api/plan' && request.method === 'POST') {
        return await handlePlan(request, env, corsHeaders);
      } else if (url.pathname === '/api/diagnose' && request.method === 'POST') {
        return await handleDiagnose(request, env, corsHeaders);
      } else if (url.pathname === '/api/health' && request.method === 'GET') {
        return new Response(JSON.stringify({ 
          status: 'OK', 
          timestamp: new Date().toISOString() 
        }), {
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          }
        });
      }

      return new Response('Not Found', { 
        status: 404,
        headers: corsHeaders 
      });

    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }
  }
};

async function handleAsk(request, env, corsHeaders) {
  try {
    const { question, context } = await request.json();
    
    if (!question) {
      return new Response(JSON.stringify({ error: 'Question is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Pass context properly - it already has all the fields we need
    const prompt = createPermaculturePrompt(question, context);
    const response = await callClaudeAPI(prompt, env.ANTHROPIC_API_KEY);
    
    return new Response(JSON.stringify({ 
      response: response.content[0].text,
      usage: response.usage 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to get AI response',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handlePlan(request, env, corsHeaders) {
  try {
    const { spaceSize, soilType, goals, location } = await request.json();
    const prompt = createPlanningPrompt(spaceSize, soilType, goals, location);
    const response = await callClaudeAPI(prompt, env.ANTHROPIC_API_KEY, 1200);
    
    return new Response(JSON.stringify({ 
      response: response.content[0].text,
      usage: response.usage 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to generate plan',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleDiagnose(request, env, corsHeaders) {
  try {
    const { plant, problem, timeframe, location } = await request.json();
    const prompt = createDiagnosisPrompt(plant, problem, timeframe, location);
    const response = await callClaudeAPI(prompt, env.ANTHROPIC_API_KEY);
    
    return new Response(JSON.stringify({ 
      response: response.content[0].text,
      usage: response.usage 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to diagnose issue',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function callClaudeAPI(prompt, apiKey, maxTokens = 1000) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  return await response.json();
}

// Helper functions (same as your original server.js)
function createPermaculturePrompt(userQuestion, context = {}) {
  const { 
    location = 'Iowa, Zone 5', 
    soilType = 'clay', 
    spaceSize = 'small homestead',
    currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    season = 'Current season'
  } = context;
  
  // Debug logging
  console.log('🔍 Worker received location:', location);
  console.log('📦 Full context:', JSON.stringify(context));
  
  return `You are an expert permaculture consultant specializing in sustainable agriculture and homesteading. 

CONTEXT:
- Location: ${location}
- Soil type: ${soilType}
- Space: ${spaceSize}
- Current date: ${currentDate}
- Season: ${season}

USER QUESTION: ${userQuestion}

Please provide practical, location-specific advice that considers:
1. The local climate and growing conditions for this specific time of year
2. Permaculture principles (care for earth, care for people, fair share)
3. Sustainable and regenerative practices
4. Integration with natural ecosystems
5. Seasonal timing and appropriate tasks for ${season}

Format your response with clear sections and actionable advice. Use emojis sparingly for readability.`;
}

function createPlanningPrompt(spaceSize, soilType, goals, location = 'Iowa, Zone 5') {
  return `You are a permaculture design consultant. Create a detailed plan for:

SITE DETAILS:
- Space: ${spaceSize}
- Soil: ${soilType}
- Location: ${location} (driftless region)
- Goals: ${goals}

Please provide:
1. Zone-based design layout
2. Recommended plant guilds for the soil/climate
3. Implementation timeline
4. Specific recommendations for soil management
5. Integration opportunities for future sensor/automation systems

Focus on practical, achievable steps for a homesteader with limited initial budget.`;
}

function createDiagnosisPrompt(plant, problem, timeframe, location = 'Iowa, Zone 5') {
  return `You are a plant pathologist and permaculture expert. Diagnose this issue:

PLANT: ${plant}
SYMPTOMS: ${problem}
TIMEFRAME: ${timeframe}
LOCATION: ${location}

Please provide:
1. Most likely causes (considering local conditions)
2. Immediate treatment steps
3. Long-term prevention strategies
4. When to expect improvement
5. Warning signs to watch for

Focus on organic, sustainable solutions that align with permaculture principles.`;
}