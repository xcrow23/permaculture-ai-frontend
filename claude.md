# Permaculture AI Cloudflare - Project Guide

## Project Overview

**Permaculture AI** is a full-stack web application that combines permaculture expertise with AI-powered assistance through Anthropic's Claude API. It's deployed on Cloudflare with a serverless backend (Workers) and a static frontend (Pages).

**Key Purpose:** Provide location-aware, seasonal permaculture guidance through four specialized tools: consultation, design planning, plant diagnostics, and future sensor integration.

---

## Architecture

### Tech Stack
- **Frontend:** Vanilla HTML5/CSS3/JavaScript (single 52KB file, no build process)
- **Backend:** Cloudflare Workers (serverless edge computing)
- **AI:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Deployment:** Cloudflare Pages + Workers
- **Version Control:** Git

### Key Design Decisions
1. **Single HTML file** - No build process, trivial deployment
2. **Vanilla JavaScript** - Zero framework overhead
3. **Cloudflare Workers** - Low-latency edge API responses
4. **Client-side storage** - localStorage for user preferences
5. **Location-aware** - USDA hardiness zones inform responses
6. **Lunar cycle integration** - Cultural/permaculture connection

---

## Directory Structure

```
permaculture-ai-cloudflare/
├── public/
│   └── index.html              # Complete SPA application (52KB)
├── worker.js                   # Cloudflare Worker backend
├── wrangler.toml              # Cloudflare configuration
├── .git/                      # Version control
├── .claude/                   # Claude IDE configuration
└── claude.md                  # This file
```

---

## Core Features

### Four Main Tabs

**1. CONSULT Tab** - Query the Intelligence
- General permaculture Q&A with seasonal context
- Four focused modes: Guild Focus, Soil Focus, Defense Focus, Cycles Focus
- Character limit: 500 chars
- Real-time UI feedback

**2. DESIGN Tab** - System Design
- Generate permaculture design plans
- Inputs: space size, soil type, goals, location
- Outputs: detailed implementation plans

**3. HEAL Tab** - Diagnose Plant Issues
- Plant pathology & diagnosis
- Inputs: plant species, problem description, timeframe, location
- Outputs: treatment & prevention strategies

**4. SENSE Tab** - Sensor Network (Phase II placeholder)
- Planned IoT sensor integration
- Real-time monitoring capabilities

### Header Components
- **Location Tag** - Editable location & USDA zone (localStorage)
- **Moon Phase Tracker** - Accurate lunar cycle with phase names & illumination
- **Season Indicator** - Current season with emoji

---

## Backend API Endpoints

**Base Worker:** `permaculture-ai-worker.dreadcrownest.workers.dev`

### Routes

| Method | Endpoint | Purpose | Max Tokens |
|--------|----------|---------|-----------|
| POST | `/api/ask` | General consultation | 1000 |
| POST | `/api/plan` | Design planning | 1200 |
| POST | `/api/diagnose` | Plant diagnostics | 1000 |
| GET | `/api/health` | Health check | - |

### Request Context
All requests automatically include:
- Current location & USDA hardiness zone
- Current season & phase
- Current moon phase
- Date

---

## Frontend Storage

Uses `localStorage` to persist user preferences:
```javascript
localStorage.userLocation  // User's location string
localStorage.userZone      // USDA hardiness zone
```

These survive page refreshes and are used in all API requests for context.

---

## Setup & Deployment

### Prerequisites
- Node.js 16+ (for Wrangler CLI)
- Cloudflare account
- Anthropic API key

### Installation
```bash
# Install Wrangler CLI
npm install -g wrangler

# Set API key
wrangler secret put ANTHROPIC_API_KEY
```

### Development
```bash
# Test locally
wrangler dev

# Deploy
wrangler deploy
```

### Frontend
- Static files are served from `public/` directory
- Single HTML file - can be served anywhere (Cloudflare Pages, etc.)
- No build step required

---

## Key Files Reference

| File | Purpose | Size |
|------|---------|------|
| `public/index.html` | Complete SPA application | 52 KB |
| `worker.js` | Backend API logic | 7.3 KB |
| `wrangler.toml` | Cloudflare config | 395 B |

---

## Development Guidelines

### Adding New Features

1. **New Tab/UI Component:**
   - Add HTML structure in `public/index.html`
   - Add CSS styling (inline in `<style>` tag)
   - Add event listeners and fetch calls

2. **New API Endpoint:**
   - Add route handler in `worker.js`
   - Include location/season context in prompt
   - Set appropriate max_tokens
   - Add CORS headers

3. **UI/UX Considerations:**
   - Mobile-first (420px container width)
   - Dark theme with neon accents (cyberpunk aesthetic)
   - Include loading states and error handling
   - Copy-to-clipboard for responses
   - Character counters with warnings

### Code Style
- Clear variable naming conventions
- Descriptive comments for complex logic
- Semantic HTML structure
- Responsive CSS with CSS variables
- Error messages with helpful context

---

## Subject-Matter Safeguards

The application implements **moderate-level safeguards** to keep responses focused on permaculture-related topics while maintaining a friendly, helpful tone.

### Safeguard Implementation

**Three-Layer Protection:**

1. **Input Validation (Frontend)**
   - Located in: `worker.js` - `validateTopicRelevance()` function
   - Checks queries against in-scope and off-topic keyword lists
   - Lenient approach: allows edge cases related to ecology, botany, animal husbandry
   - Returns `{ isRelevant: boolean, reason: string }`

2. **Off-Topic Query Logging**
   - Function: `logOffTopicQuery()` in `worker.js`
   - Logs to console for development/analysis
   - Structured log entries with timestamps
   - Future: Can integrate with Cloudflare Analytics or external service
   - Purpose: Track user intent and model improvement

3. **System Prompt Restrictions**
   - Enhanced prompts in all three endpoints
   - Each prompt includes explicit SCOPE section
   - Instructs Claude to focus on permaculture perspective
   - Covers: `createPermaculturePrompt()`, `createPlanningPrompt()`, `createDiagnosisPrompt()`

### In-Scope Topics

The safeguards allow queries about:
- **Permaculture & Regenerative Agriculture**
- **Ecology & Ecosystems** (biodiversity, conservation, habitat)
- **Botany & Plant Science** (species, cultivation, photosynthesis)
- **Animal Husbandry** (livestock, bees, composting, pasture management)
- **Gardening & Homesteading** (in permaculture context)
- **Herbalism & Medicinal Plants**
- **Water Management** (swales, ponds, irrigation, hydrology)
- **Soil Science** (health, regeneration, microbes, nutrients)
- **Seasonal & Climate Context** (hardiness zones, lunar cycles)

### Out-of-Scope Topics

Safeguards flag queries about:
- Programming/coding/technical topics
- Academic homework/essays
- Politics, religion, conspiracy
- General writing/storytelling
- Medical advice (non-plant)
- Mechanical repair
- Finance/investing

### User Experience

When off-topic queries are detected:
1. Backend returns HTTP 200 with `isOffTopic: true`
2. User receives friendly message with suggestions
3. Response includes emoji (🌱) and redirects to in-scope topics
4. Off-topic attempt is logged for analysis

**Example Response:**
```
🌱 I'm specialized in permaculture and regenerative agriculture!
That's outside my area of expertise, but I'd be happy to help with:

• Garden design and planning
• Companion planting and plant guilds
• Soil health and regeneration
[...more suggestions...]

How can I help with your permaculture or gardening needs?
```

### Configuration Notes

- **Strictness Level:** Moderate (validation + logging + prompt guidance)
- **Validation Approach:** Keyword-based (in-scope vs off-topic lists)
- **Logging Destination:** Console (development) → Can extend to external service
- **Response Code:** Returns 200 regardless (flagged with `isOffTopic` property)

### Extending the Safeguards

To adjust strictness or add keywords:
1. Edit `inScopeKeywords` array in `validateTopicRelevance()`
2. Edit `offTopicKeywords` array for stricter filtering
3. Modify `createRejectionMessage()` for different friendly messaging
4. Update `logOffTopicQuery()` to send logs to external service

---

## Security Notes

**Current State:**
- API key stored as environment secret ✓
- CORS fully open (`*`) - suitable for public app
- No authentication on endpoints (design choice)
- Input validation on frontend

**For Production Scaling:**
- Consider CORS origin restriction
- Add rate limiting to Workers
- Implement request signing if needed
- Add logging/monitoring

---

## Performance Characteristics

**Frontend:**
- 52 KB single HTML file
- No external dependencies
- Inline CSS (no stylesheet downloads)
- Minimal HTTP requests

**Backend:**
- Edge-deployed (Cloudflare CDN)
- ~1-2 second response time (Claude API latency)
- No caching layer (fresh response each time)

---

## Future Roadmap (Phase II)

**Sensor Network Integration:**
- Real-time IoT sensor data (soil moisture, temp, pH)
- Temporal pattern tracking
- Autonomous system responses
- Bioregional practitioner network

**Infrastructure:**
- Custom Cloudflare Pages routing
- Advanced data visualization
- Multi-user accounts
- Persistent data storage

---

## Useful Commands

```bash
# View Wrangler config
wrangler tail                    # View live logs

# Manage secrets
wrangler secret list            # List all secrets
wrangler secret put KEY         # Set a secret

# Deploy
wrangler deploy                 # Deploy to production
wrangler publish                # Publish Worker

# Local development
wrangler dev                    # Start local server
```

---

## Common Tasks

### Adding a new query mode to CONSULT tab:
1. Add button HTML in tab
2. Add click event listener that sets `queryMode`
3. Create specialized prompt in worker endpoint
4. Update API call to include mode

### Changing the AI model:
1. Update model name in `worker.js` (search for `claude-sonnet`)
2. Adjust `max_tokens` if needed
3. Test response quality

### Updating location logic:
1. Edit location display in `public/index.html`
2. Update `updateLocationTag()` function
3. Verify localStorage updates
4. Test location context in API responses

---

## Notes for Claude

- This project has **zero build dependencies** - just vanilla files
- The UI is a complete SPA in a single HTML file with embedded CSS/JS
- All API context (location, season, moon phase) is calculated on the frontend
- The backend is a lightweight router that delegates to Claude API
- Responsive breakpoint is 420px (mobile-first design)
- Default location is Iowa, Zone 5 (developer's location)

---

## Contact & Contribution

For questions about the architecture or development, refer to:
- Recent git commits (visible in commit history)
- Code comments in `public/index.html` and `worker.js`
- Feature TODOs marked in comments

**Last Updated:** 2025-11-15
