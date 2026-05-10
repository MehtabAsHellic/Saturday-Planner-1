# Saturday Planner 1

Perfect Saturday Planner is a small AI-style agent web app.

## Live URL (Required Submission Field)

- **Live URL:** _Add deployed URL here (for example Railway/Render/Vercel)_

## What it does

- Accepts either structured fields or free-text preferences
- Uses multiple tools/functions (not one giant prompt):
  - `parseUserPreferences`
  - `getActivityOptions`
  - `getFoodOptions`
  - `generateFinalPlan`
  - `estimateCost`
  - `validatePlan`
- Generates a realistic, constraint-aware Saturday plan
- Explains why each step fits the user
- Handles failure cases:
  - asks clarifying questions when critical info is missing
  - uses a fallback plan if no options match
- Shows an agent trace in the UI

## Required Input (Example)

```json
{
  "city": "Bangalore",
  "budget": 2000,
  "available_time": "4 hours",
  "mood": "tired but wants to do something fun",
  "interests": ["food", "music", "walks"],
  "constraints": ["vegetarian", "avoid crowded places"]
}
```

## Assignment Compliance Checklist

- [x] Hosted web UI implemented (Node + Express static frontend); deployable to public hosts
- [x] Understands user preferences from structured input and free text
- [x] Uses at least 3 tools/functions (`parseUserPreferences`, `getActivityOptions`, `getFoodOptions`, `generateFinalPlan`, `estimateCost`, `validatePlan`)
- [x] Generates realistic, specific, constraint-aware plans
- [x] Explains why each step fits the user
- [x] Handles failure cases gracefully (network failure messaging + fallback plan when no options match)
- [x] Shows a clear agent trace in UI output
- [x] README includes local run instructions
- [x] README includes notes on AI tool usage
- [ ] Public deployed URL filled in

## Run locally

```bash
npm install
export GEOCODE_EARTH_API_KEY=your_api_key_here
npm start
```

Open `http://localhost:3000`.

> The planner enriches city input using Geocode Earth (`https://api.geocode.earth/v1/search`) when `GEOCODE_EARTH_API_KEY` is set.

## Test

```bash
npm test
```

## Deploy (hosted URL)

### Vercel

A `vercel.json` is included so Vercel builds this app as a Node.js serverless function instead of attempting an Angular build.

1. Import the repository in the [Vercel dashboard](https://vercel.com/new).
2. Add the environment variable `GEOCODE_EARTH_API_KEY` under **Settings → Environment Variables** (optional — the planner works without it, but geocoding will be skipped).
3. Deploy. No custom build command is needed; `vercel.json` handles the configuration.

### Other platforms (Render, Railway, Fly.io)

- Build command: `npm install`
- Start command: `npm start`
- Set the `GEOCODE_EARTH_API_KEY` environment variable in the platform's settings if you want geocoding.

After deployment, paste the generated public URL into the "Live URL" section above.

## AI Tool Usage (2–3 lines)

I used AI coding assistance to scaffold and refine the Express API + frontend flow quickly.
I used AI support to structure the planner into smaller tool-like functions instead of one monolithic prompt.
I also used AI review/validation tooling to catch wording and error-handling improvements before finalizing.
