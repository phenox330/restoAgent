import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function listRestaurants() {
  console.log('📋 Liste des restaurants dans Supabase...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variables d\'environnement manquantes !');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('id, name, sms_enabled, user_id, created_at');

  if (error) {
    console.error('❌ Erreur:', error);
    return;
  }

  if (!restaurants || restaurants.length === 0) {
    console.log('⚠️ Aucun restaurant trouvé dans la base de données !');
    return;
  }

  console.log(`✅ ${restaurants.length} restaurant(s) trouvé(s):\n`);
  restaurants.forEach((r, i) => {
    console.log(`${i + 1}. ${r.name || 'Sans nom'}`);
    console.log(`   ID: ${r.id}`);
    console.log(`   user_id: ${r.user_id}`);
    console.log(`   sms_enabled: ${r.sms_enabled}`);
    console.log(`   created_at: ${r.created_at}`);
    console.log('');
  });
}

listRestaurants().catch(console.error);




