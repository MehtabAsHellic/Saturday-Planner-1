# Saturday Planner 1

Perfect Saturday Planner is a small AI-style agent web app.

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

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Test

```bash
npm test
```

## Deploy (hosted URL)

This app is deployable to services like Render, Railway, or Fly.io using:
- Build command: `npm install`
- Start command: `npm start`
