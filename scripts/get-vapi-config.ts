import 'dotenv/config';

const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY;
const ASSISTANT_ID = 'b31a622f-68c6-4eaf-a6ce-58a14ddcad23';

async function getVapiConfig() {
  if (!VAPI_PRIVATE_KEY) {
    console.error('❌ VAPI_PRIVATE_KEY non configurée');
    process.exit(1);
  }

  console.log('📋 Récupération de la configuration Vapi...\n');

  const response = await fetch(`https://api.vapi.ai/assistant/${ASSISTANT_ID}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${VAPI_PRIVATE_KEY}`,
    },
  });

  if (!response.ok) {
    console.error('❌ Erreur:', await response.text());
    process.exit(1);
  }

  const config = await response.json();

  console.log('=== CONFIGURATION COMPLÈTE ===\n');
  console.log(JSON.stringify(config, null, 2));

  console.log('\n=== RÉSUMÉ ===');
  console.log('serverUrl:', config.serverUrl);
  console.log('server.url:', config.server?.url);
  console.log('metadata:', JSON.stringify(config.metadata));
  console.log('model:', config.model?.model);
  console.log('serverMessages:', config.serverMessages);
  
  // Vérifier les functions vs tools
  if (config.model?.functions) {
    console.log('\n📌 Functions définies (model.functions):');
    config.model.functions.forEach((f: any) => {
      console.log(`  - ${f.name}`);
    });
  }
  
  if (config.model?.tools) {
    console.log('\n📌 Tools définis (model.tools):');
    config.model.tools.forEach((t: any) => {
      console.log(`  - ${t.function?.name || t.name}, type: ${t.type}, server: ${t.server?.url}`);
    });
  }
}

getVapiConfig().catch(console.error);




