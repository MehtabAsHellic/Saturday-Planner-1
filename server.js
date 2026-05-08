const express = require('express');
const path = require('path');
const { createSaturdayPlan } = require('./src/planner');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/plan', (req, res) => {
  try {
    const { input, mode } = req.body || {};
    const payload = mode === 'free-text' ? String(input || '') : (input || {});
    const result = createSaturdayPlan(payload);

    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.json(result);
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
