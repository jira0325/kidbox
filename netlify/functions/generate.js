const https = require('https');

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { prompt } = JSON.parse(event.body);

    const requestBody = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `Tu es Kidbox, un assistant spécialisé en activités pour enfants.
Génère UNE activité adaptée à la situation décrite.
Réponds UNIQUEMENT en JSON valide, sans markdown, sans explication :
{
  "emoji": "🎨",
  "titre": "Nom de l'activité",
  "age": "3-6 ans",
  "duree": "20 min",
  "lieu": "Intérieur",
  "materiel": ["item1", "item2"],
  "etapes": ["Étape 1.", "Étape 2.", "Étape 3.", "Étape 4."],
  "conseil": "Un conseil pratique."
}
JSON uniquement, rien d'autre.`,
      messages: [{ role: 'user', content: prompt }]
    });

    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(requestBody)
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch(e) { reject(new Error('Réponse invalide : ' + body)); }
        });
      });

      req.on('error', reject);
      req.write(requestBody);
      req.end();
    });

    if (data.error) {
      throw new Error(data.error.message || JSON.stringify(data.error));
    }

    const text = data.content?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const activite = JSON.parse(clean);

    return { statusCode: 200, headers, body: JSON.stringify(activite) };

  } catch(e) {
    console.error('Erreur generate:', e.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: e.message })
    };
  }
};