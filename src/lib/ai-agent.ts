import type { FirestoreQuerySpec } from '@/types'

export async function generateQuerySpec(
  prompt: string,
  schemaContext: string,
): Promise<FirestoreQuerySpec> {
  const apiKey = process.env.CLAUDE_API_KEY
  if (!apiKey) throw new Error('CLAUDE_API_KEY is not configured.')

  const model = process.env.CLAUDE_MODEL ?? 'claude-opus-4-6'

  const systemPrompt =
    'You are a Firestore report generator. Given a natural language request and a Firestore database schema, ' +
    'you generate a structured query specification.\n\n' +
    'Rules:\n' +
    '- Only query collections that appear in the schema below.\n' +
    '- Use only supported filter operators: ==, !=, <, <=, >, >=, in, array-contains\n' +
    '- Do NOT generate SQL. Return Firestore filter conditions only.\n' +
    '- Return ONLY valid JSON matching the schema below - no markdown, no explanation.\n\n' +
    schemaContext + '\n\n' +
    'Response JSON schema:\n' +
    '{\n' +
    '  "title": "string - concise report title",\n' +
    '  "description": "string - 1-2 sentence description",\n' +
    '  "collection": "string - Firestore collection name",\n' +
    '  "filters": [\n' +
    '    { "field": "fieldName", "op": "==", "value": "filterValue" }\n' +
    '  ],\n' +
    '  "limit": 1000,\n' +
    '  "summarySpec": [\n' +
    '    { "label": "Total Orders", "sourceColumn": "amount", "aggregation": "sum", "format": "currency" }\n' +
    '  ],\n' +
    '  "columns": [\n' +
    '    { "key": "fieldName", "label": "Display Name", "type": "string", "sortable": true }\n' +
    '  ]\n' +
    '}'

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Claude API error ${res.status}: ${text}`)
  }

  const data = await res.json() as { content: { text: string }[] }
  let json = data.content[0].text.trim()

  // Strip markdown fences if Claude includes them despite instructions
  if (json.startsWith('```')) {
    const start = json.indexOf('\n') + 1
    const end = json.lastIndexOf('```')
    json = json.slice(start, end).trim()
  }

  return JSON.parse(json) as FirestoreQuerySpec
}
