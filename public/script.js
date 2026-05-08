const structuredForm = document.getElementById('structured-form');
const freeForm = document.getElementById('free-form');
const resultBox = document.getElementById('result');

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderResult(data) {
  resultBox.classList.remove('hidden');

  if (!data.success) {
    const message = data.message ? `<p>${escapeHtml(data.message)}</p>` : "<p>I couldn't confidently create a plan yet.</p>";
    const questions = (data.clarifyingQuestions || []).map(q => `<li>${escapeHtml(q)}</li>`).join('');
    resultBox.innerHTML = `
      <h2>Need a little more info</h2>
      ${message}
      <ul>${questions}</ul>
      <h3>Trace</h3>
      <pre>${escapeHtml(JSON.stringify(data.trace, null, 2))}</pre>
    `;
    return;
  }

  const planHtml = data.plan
    .map(item => `<li><strong>Step ${item.step}:</strong> ${escapeHtml(item.name)} (${escapeHtml(item.duration)}, ₹${item.estimatedCost})<br/><em>Why this fits:</em> ${escapeHtml(item.whyThisFits)}</li>`)
    .join('');

  const warnings = (data.warnings || []).length
    ? `<p><strong>Notes:</strong> ${data.warnings.map(escapeHtml).join(' ')}</p>`
    : '';

  const validationNotes = data.summary.validationNotes.length
    ? `<ul>${data.summary.validationNotes.map(note => `<li>${escapeHtml(note)}</li>`).join('')}</ul>`
    : '<p>All constraints validated.</p>';

  const tradeOffs = (data.tradeOffs || []).length
    ? `<ul>${data.tradeOffs.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul>`
    : '<p>No major trade-offs needed.</p>';

  const location = data.location && data.location.coordinates?.length === 2
    ? `<p><strong>Detected city:</strong> ${escapeHtml(data.location.label)} (${data.location.coordinates[1].toFixed(4)}, ${data.location.coordinates[0].toFixed(4)})</p>`
    : '';

  resultBox.innerHTML = `
    <h2>Your Saturday plan</h2>
    ${location}
    ${warnings}
    <ol>${planHtml}</ol>
    <p><strong>Estimated total cost:</strong> ₹${data.summary.estimatedTotalCost}</p>
    <p><strong>Estimated total time:</strong> ${data.summary.estimatedTotalDurationMinutes} mins</p>
    <p><strong>Budget:</strong> ₹${data.summary.budget} | <strong>Available time:</strong> ${escapeHtml(data.summary.availableTime)}</p>

    <h3>Trade-offs considered</h3>
    ${tradeOffs}

    <h3>Constraint check</h3>
    ${validationNotes}

    <h3>Agent trace</h3>
    <pre>${escapeHtml(JSON.stringify(data.trace, null, 2))}</pre>
  `;
}

async function requestPlan(payload) {
  const buttons = Array.from(document.querySelectorAll('button'));
  buttons.forEach(btn => { btn.disabled = true; });
  resultBox.classList.remove('hidden');
  resultBox.innerHTML = '<p>Agent is thinking...</p>';
  try {
    const response = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    renderResult(data);
  } catch (_error) {
    renderResult({
      success: false,
      message: 'Network error while requesting plan. Please retry in a few seconds.',
      clarifyingQuestions: [],
      trace: [{ tool: 'requestPlan', status: 'failed', details: 'Network error while requesting plan.' }]
    });
  } finally {
    buttons.forEach(btn => { btn.disabled = false; });
  }
}

structuredForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const fd = new FormData(structuredForm);

  const input = {
    city: fd.get('city'),
    budget: Number(fd.get('budget')),
    available_time: fd.get('available_time'),
    mood: fd.get('mood'),
    interests: String(fd.get('interests') || '').split(',').map(s => s.trim()).filter(Boolean),
    constraints: String(fd.get('constraints') || '').split(',').map(s => s.trim()).filter(Boolean)
  };

  await requestPlan({ mode: 'structured', input });
});

freeForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const fd = new FormData(freeForm);
  await requestPlan({ mode: 'free-text', input: fd.get('input') || '' });
});
