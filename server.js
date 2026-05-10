const express = require('express');
const path = require('path');
const { createSaturdayPlan } = require('./src/planner');

const app = express();
const PORT = process.env.PORT || 3000;
const GEOCODE_EARTH_API_KEY = process.env.GEOCODE_EARTH_API_KEY;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function geocodeCity(city) {
  if (!GEOCODE_EARTH_API_KEY || !city) return null;
  const url = new URL('https://api.geocode.earth/v1/search');
  url.searchParams.set('text', city);
  url.searchParams.set('size', '1');
  url.searchParams.set('api_key', GEOCODE_EARTH_API_KEY);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Geocoding failed with status ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const feature = data.features?.[0];
  if (!feature) return null;

  return {
    label: feature.properties?.label || feature.properties?.name || city,
    coordinates: feature.geometry?.coordinates || [],
    confidence: feature.properties?.confidence ?? null
  };
}

app.post('/api/plan', async (req, res) => {
  try {
    const { input, mode } = req.body || {};
    const payload = mode === 'free-text' ? String(input || '') : (input || {});
    const result = createSaturdayPlan(payload);

    if (!result.success) {
      return res.status(400).json(result);
    }
    let location = null;
    if (result.preferences?.city) {
      if (!GEOCODE_EARTH_API_KEY) {
        // result.warnings = [...(result.warnings || []), 'Geocoding skipped because GEOCODE_EARTH_API_KEY is not configured.'];
      } else {
        try {
          location = await geocodeCity(result.preferences.city);
        } catch (error) {
          result.warnings = [...(result.warnings || []), 'City location lookup failed due to a geocoding API/network issue; continuing without geocoding.'];
          result.trace = [...(result.trace || []), { tool: 'geocodeCity', status: 'failed', details: error.message }];
        }
      }
    }

    return res.json({ ...result, location });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate plan. Please try again.',
      trace: [{ tool: 'api', status: 'failed', details: error.message }]
    });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Perfect Saturday Planner running on port ${PORT}`);
});
