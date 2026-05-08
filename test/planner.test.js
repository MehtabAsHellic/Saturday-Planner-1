const test = require('node:test');
const assert = require('node:assert/strict');

const { createSaturdayPlan, parseUserPreferences } = require('../src/planner');

test('creates valid structured plan with trace', () => {
  const result = createSaturdayPlan({
    city: 'Bangalore',
    budget: 2000,
    available_time: '4 hours',
    mood: 'tired but wants to do something fun',
    interests: ['food', 'music', 'walks'],
    constraints: ['vegetarian', 'avoid crowded places']
  });

  assert.equal(result.success, true);
  assert.ok(result.plan.length >= 1);
  assert.ok(result.trace.length >= 6);
  assert.equal(result.summary.validAgainstConstraints, true);
});

test('handles empty input with defaults', () => {
  const parsed = parseUserPreferences(null);
  assert.equal(parsed.parsed.city, 'Bangalore');
  assert.ok(parsed.warnings.length > 0);
});
