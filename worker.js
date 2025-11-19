// worker.js - Cloudflare Worker for Permaculture AI API

// ============================================================================
// SUBJECT-MATTER SAFEGUARDS
// ============================================================================

/**
 * Validates if a query is related to permaculture, ecology, botany, or animal husbandry
 * Takes a moderate approach: lenient on edge cases, friendly tone
 *
 * Scope includes:
 * - Permaculture & regenerative agriculture
 * - Ecology & ecosystems
 * - Botany & plant science
 * - Animal husbandry & integrated livestock
 * - Gardening & homesteading in permaculture context
 * - Herbalism & medicinal plants
 * - Sustainability & environmental topics related to land management
 */
function validateTopicRelevance(input) {
  // Comprehensive keyword list for in-scope topics
  const inScopeKeywords = [
    // Permaculture core
    'permaculture', 'regenerative', 'sustainable', 'homestead', 'homesteading',

    // Plants & gardening
    'plant', 'garden', 'garden', 'grow', 'growing', 'cultivat', 'harvest', 'seed',
    'soil', 'compost', 'mulch', 'leaf', 'root', 'flower', 'fruit', 'vegetable',
    'tree', 'shrub', 'perennial', 'annual', 'weed', 'herb',

    // Ecology & environment
    'ecolog', 'ecosystem', 'biodiversity', 'wildlife', 'pollinator', 'insect',
    'bird', 'native', 'invasive', 'habitat', 'conservation', 'restoration',
    'carbon', 'nitrogen', 'phosphorus', 'nutrient', 'cycle',

    // Botany & science
    'botany', 'botanical', 'species', 'cultivar', 'genus', 'photosynthesis',
    'transpiration', 'osmosis', 'chlorophyll', 'phenotype',

    // Water & soil management
    'water', 'irrigation', 'swale', 'pond', 'rainwater', 'drainage', 'hydrology',
    'soil', 'tilth', 'texture', 'clay', 'sand', 'silt', 'ph', 'acidic', 'alkaline',
    'microbe', 'bacteria', 'fungi', 'mycorrhiz',

    // Animal husbandry
    'animal', 'livestock', 'cattle', 'sheep', 'goat', 'chicken', 'bee', 'apiary',
    'composting', 'manure', 'pasture', 'grazing', 'rotation',

    // Design & planning
    'design', 'plan', 'layout', 'zone', 'guild', 'polycultur', 'intercrop',
    'rotation', 'succession', 'yield', 'productivity',

    // Seasonal & climate
    'season', 'seasonal', 'climate', 'hardiness', 'frost', 'freeze', 'microclimate',
    'phenophase', 'moon phase', 'lunar',

    // Herbalism & medicine
    'medicinal', 'herbal', 'tincture', 'infusion', 'remedy', 'healing',

    // Permaculture ethics
    'ethics', 'earthcare', 'peoplecare', 'fairshare', 'principle'
  ];

  // Keywords that suggest off-topic queries
  const offTopicKeywords = [
    'code', 'program', 'function', 'variable', 'debug', 'error',
    'homework', 'essay', 'write', 'poem', 'story', 'fiction',
    'homework', 'quiz', 'exam',
    'politics', 'religion', 'conspiracy',
    'hack', 'crack', 'exploit', 'malware',
    'investment', 'crypto', 'stock', 'trading',
    'medical', 'doctor', 'disease', 'prescription', 'drug',
    'repair', 'fix', 'mechanical',
    'financial', 'tax', 'loan', 'mortgage'
  ];

  const lowerInput = input.toLowerCase();

  // Check for definite off-topic keywords
  const hasOffTopicKeyword = offTopicKeywords.some(keyword => lowerInput.includes(keyword));

  // Check for in-scope keywords
  const hasInScopeKeyword = inScopeKeywords.some(keyword => lowerInput.includes(keyword));

  // If query contains off-topic keywords AND no in-scope keywords, flag it
  if (hasOffTopicKeyword && !hasInScopeKeyword) {
    return {
      isRelevant: false,
      reason: 'off-topic'
    };
  }

  // If very short and vague, require more context
  if (lowerInput.length < 10 && !hasInScopeKeyword) {
    return {
      isRelevant: false,
      reason: 'too-vague'
    };
  }

  // Default to allowing (moderate/lenient approach)
  return {
    isRelevant: true,
    reason: 'in-scope'
  };
}

/**
 * Creates a friendly rejection message when query is off-topic
 */
function createRejectionMessage(validationResult) {
  const suggestions = [
    '• Garden design and planning',
    '• Companion planting and plant guilds',
    '• Soil health and regeneration',
    '• Permaculture principles and ethics',
    '• Seasonal farming and moon cycles',
    '• Ecological systems and biodiversity',
    '• Plant diagnostics and herbalism',
    '• Water management and swales',
    '• Animal integration and husbandry'
  ];

  let message = '🌱 I\'m specialized in permaculture and regenerative agriculture! ';

  if (validationResult.reason === 'too-vague') {
    message += 'Could you provide more details about your gardening or permaculture question?\n\n';
  } else {
    message += 'That\'s outside my area of expertise, but I\'d be happy to help with:\n\n';
  }

  message += suggestions.join('\n') + '\n\n';
  message += 'How can I help with your permaculture or gardening needs?';

  return message;
}

/**
 * Logs off-topic queries for analysis and model improvement
 */
async function logOffTopicQuery(query, endpoint, env) {
  try {
    // Log to console for immediate visibility
    console.log(`[OFF-TOPIC] [${endpoint}] Query: "${query}"`);

    // Prepare structured log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      endpoint: endpoint,
      query: query,
      queryLength: query.length,
      type: 'off-topic-attempt'
    };

    // Note: In production, this could be sent to:
    // - Cloudflare Analytics/Logpush
    // - External analytics service
    // - Database for later analysis
    // For now, console logging is sufficient for development/analysis
    console.log(JSON.stringify(logEntry));
  } catch (error) {
    console.error('Error logging off-topic query:', error);
  }
}

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
      } else if (url.pathname === '/api/grid-plan' && request.method === 'POST') {
        return await handleGridPlan(request, env, corsHeaders);
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

    // SAFEGUARD: Validate topic relevance
    const validation = validateTopicRelevance(question);
    if (!validation.isRelevant) {
      await logOffTopicQuery(question, '/api/ask', env);
      return new Response(JSON.stringify({
        response: createRejectionMessage(validation),
        isOffTopic: true,
        validationReason: validation.reason
      }), {
        status: 200, // Return 200 but flag as off-topic
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Pass context properly - it already has all the fields we need
    const prompt = createPermaculturePrompt(question, context);
    const response = await callClaudeAPI(prompt, env.ANTHROPIC_API_KEY);

    return new Response(JSON.stringify({
      response: response.content[0].text,
      usage: response.usage,
      isOffTopic: false
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

    // SAFEGUARD: Validate goals are permaculture-related
    const validation = validateTopicRelevance(goals);
    if (!validation.isRelevant) {
      await logOffTopicQuery(`DESIGN: ${goals}`, '/api/plan', env);
      return new Response(JSON.stringify({
        response: createRejectionMessage(validation),
        isOffTopic: true,
        validationReason: validation.reason
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const prompt = createPlanningPrompt(spaceSize, soilType, goals, location);
    const response = await callClaudeAPI(prompt, env.ANTHROPIC_API_KEY, 1200);

    return new Response(JSON.stringify({
      response: response.content[0].text,
      usage: response.usage,
      isOffTopic: false
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

    // SAFEGUARD: Validate plant and problem are plant-related
    const plantValidation = validateTopicRelevance(plant);
    const problemValidation = validateTopicRelevance(problem);

    if (!plantValidation.isRelevant || !problemValidation.isRelevant) {
      await logOffTopicQuery(`DIAGNOSE - Plant: ${plant}, Problem: ${problem}`, '/api/diagnose', env);
      return new Response(JSON.stringify({
        response: createRejectionMessage(plantValidation.isRelevant ? problemValidation : plantValidation),
        isOffTopic: true,
        validationReason: plantValidation.isRelevant ? problemValidation.reason : plantValidation.reason
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const prompt = createDiagnosisPrompt(plant, problem, timeframe, location);
    const response = await callClaudeAPI(prompt, env.ANTHROPIC_API_KEY);

    return new Response(JSON.stringify({
      response: response.content[0].text,
      usage: response.usage,
      isOffTopic: false
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

async function handleGridPlan(request, env, corsHeaders) {
  try {
    const { width, length, plants, location = 'Iowa, Zone 5', zone = '5', soilType = 'loam' } = await request.json();

    // Validation
    if (!width || !length || !plants) {
      return new Response(JSON.stringify({ error: 'Width, length, and plants are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // SAFEGUARD: Validate plants are permaculture-related
    const validation = validateTopicRelevance(plants);
    if (!validation.isRelevant) {
      await logOffTopicQuery(`GRID-PLAN: ${plants}`, '/api/grid-plan', env);
      return new Response(JSON.stringify({
        response: createRejectionMessage(validation),
        isOffTopic: true,
        validationReason: validation.reason
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const prompt = createGridPlanPrompt(width, length, plants, location, zone, soilType);
    const response = await callClaudeAPI(prompt, env.ANTHROPIC_API_KEY, 1500);

    return new Response(JSON.stringify({
      response: response.content[0].text,
      usage: response.usage,
      isOffTopic: false
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to generate grid plan',
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

  return `You are an expert permaculture consultant specializing in sustainable agriculture, regenerative practices, ecology, and homesteading.

SCOPE: You only answer questions related to permaculture, regenerative agriculture, ecology, botany, plant science, animal husbandry, gardening, and sustainable land management.

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
5. Ecological relationships and biodiversity
6. Seasonal timing and appropriate tasks for ${season}

Keep your response focused on permaculture and regenerative agriculture. If the question touches on related topics like ecology or botany, provide the permaculture perspective.

Format your response with clear sections and actionable advice. Use emojis sparingly for readability.`;
}

function createPlanningPrompt(spaceSize, soilType, goals, location = 'Iowa, Zone 5') {
  return `You are a permaculture design consultant specializing in regenerative agriculture and sustainable homesteading.

SCOPE: You only create design plans for permaculture, regenerative agriculture, sustainable gardening, and ecological food production systems.

SITE DETAILS:
- Space: ${spaceSize}
- Soil: ${soilType}
- Location: ${location}
- Goals: ${goals}

Please provide:
1. Zone-based design layout (permaculture zones)
2. Recommended plant guilds for the soil/climate
3. Ecological relationships and polyculture design
4. Implementation timeline
5. Specific recommendations for soil management and regeneration
6. Integration opportunities for future sensor/automation systems
7. Animal integration possibilities if applicable

Focus on practical, achievable steps for a homesteader with limited initial budget. Emphasize regenerative and sustainable practices.`;
}

function createDiagnosisPrompt(plant, problem, timeframe, location = 'Iowa, Zone 5') {
  return `You are a plant pathologist and permaculture expert specializing in organic, sustainable plant health.

SCOPE: You only diagnose plant issues and provide solutions within permaculture and regenerative agriculture frameworks. Focus on ecological and organic approaches.

PLANT: ${plant}
SYMPTOMS: ${problem}
TIMEFRAME: ${timeframe}
LOCATION: ${location}

Please provide:
1. Most likely causes (considering local conditions and ecology)
2. Immediate treatment steps (organic/sustainable methods)
3. Long-term prevention strategies aligned with permaculture design
4. When to expect improvement
5. Warning signs to watch for
6. Ecological/botanical context for the issue

Focus exclusively on organic, sustainable, and permaculture-aligned solutions. Consider the plant's role in the broader ecosystem.`;
}

function createGridPlanPrompt(width, length, plants, location = 'Iowa, Zone 5', zone = '5', soilType = 'loam') {
  return `You are an expert permaculture designer specializing in spatial garden layout and plant spacing.

SCOPE: You create practical, spatial garden plans using permaculture principles for the given plot size and location.

PLOT DETAILS:
- Dimensions: ${width}ft × ${length}ft (Area: ${width * length} sq ft)
- Location: ${location}
- USDA Zone: ${zone}
- Soil Type: ${soilType}
- Plants to include: ${plants}

Please provide:
1. **DESIGN RECOMMENDATIONS** (2-3 paragraphs)
   - Overall layout strategy considering space and zone
   - Companion planting relationships
   - Spacing requirements for each plant
   - Soil preparation and amendments
   - Seasonal planting timeline

2. **PLANT PLACEMENT GUIDE** (structured format)
   For each plant, provide:
   - Plant name
   - Quantity/spacing in feet (e.g., "24 inches apart")
   - Suggested position in the garden (N, S, E, W, Center, etc.)
   - Companion plants (which ones to place nearby)
   - Planting depth and height at maturity

3. **VISUAL LAYOUT DESCRIPTION**
   - Describe the optimal arrangement as if looking down at the ${width}ft × ${length}ft plot
   - Include sun exposure considerations
   - Water management zones
   - Soil amendments per zone

4. **CARE NOTES**
   - Watering schedule and zones
   - Maintenance timeline
   - Succession planting for continuous harvest (if applicable)

Make this practical and actionable for someone building this garden.`;
}