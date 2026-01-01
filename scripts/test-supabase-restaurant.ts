import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const RESTAURANT_ID = 'a0a1a251-0f2d-495a-9141-8115a10a9d77';

async function testSupabase() {
  console.log('🔍 Test connexion Supabase...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Configuré' : '❌ Manquant');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Configuré' : '❌ Manquant');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('\n❌ Variables d\'environnement manquantes !');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('\n📋 Recherche du restaurant:', RESTAURANT_ID);

  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', RESTAURANT_ID)
    .single();

  if (error) {
    console.error('❌ Erreur Supabase:', error);
    return;
  }

  if (!restaurant) {
    console.error('❌ Restaurant non trouvé !');
    return;
  }

  console.log('\n✅ Restaurant trouvé !');
  console.log('  - ID:', restaurant.id);
  console.log('  - Nom:', restaurant.name);
  console.log('  - sms_enabled:', restaurant.sms_enabled);
  console.log('  - max_capacity_lunch:', restaurant.max_capacity_lunch);
  console.log('  - max_capacity_dinner:', restaurant.max_capacity_dinner);
  console.log('  - opening_hours:', JSON.stringify(restaurant.opening_hours));
}

testSupabase().catch(console.error);




