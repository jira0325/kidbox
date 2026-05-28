exports.handler = async function(event) {
  // Autoriser les requêtes depuis ton site
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Gérer les requêtes OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { prompt } = JSON.parse(event.body);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `Tu es Kidbox, un assistant spécialisé en activités pour enfants.
Tu dois générer UNE activité créative, éducative ou ludique adaptée à la situation décrite.
Réponds UNIQUEMENT en JSON valide, sans markdown, sans explication, exactement dans ce format :
{
  "emoji": "🎨",
  "titre": "Nom de l'activité",
  "age": "3-6 ans",
  "duree": "20 min",
  "lieu": "Intérieur",
  "materiel": ["item1", "item2", "item3"],
  "etapes": ["Étape 1 détaillée.", "Étape 2 détaillée.", "Étape 3 détaillée.", "Étape 4 détaillée."],
  "conseil": "Un conseil pratique et bienveillant pour réussir l'activité."
}
Règles : activité réalisable immédiatement, étapes claires, pas plus de 6 items matériel, pas plus de 5 étapes. JSON uniquement.`,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const activite = JSON.parse(clean);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(activite)
    };

  } catch(e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: e.message })
    };
  }
};