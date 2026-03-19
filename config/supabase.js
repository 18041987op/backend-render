// backend/config/supabase.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const shopId = process.env.SHOP_UUID;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment variables');
  process.exit(1);
}

if (!shopId) {
  console.error('❌ Missing SHOP_UUID in environment variables');
  process.exit(1);
}

// Service role client — bypasses RLS for backend operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Verify Supabase connection on startup.
 * Returns the shop_id if successful.
 */
export const connectDB = async () => {
  try {
    const { data, error } = await supabase
      .from('shop_integrations')
      .select('id, shop_name')
      .eq('id', shopId)
      .single();

    if (error) throw error;

    console.log(`✅ Supabase conectado — Shop: ${data.shop_name} (${data.id})`);
    return data;
  } catch (error) {
    console.error('❌ Error al conectar a Supabase:', error.message);
    throw error;
  }
};

export { supabase, shopId };
export default supabase;
