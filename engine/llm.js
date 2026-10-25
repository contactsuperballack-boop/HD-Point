// Zero-dependency Claude call. Needs ANTHROPIC_API_KEY.
export async function ask(model, system, user) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: 3000, system, messages: [{ role: 'user', content: user }] })
  });
  if (!res.ok) throw new Error('LLM error ' + res.status + ' ' + (await res.text()));
  const data = await res.json();
  return data.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
}
export const parseJson = t => JSON.parse(t.replace(/```json|```/g, '').trim());
