const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((a, c) => {
  const [k, ...v] = c.split('=');
  if (k) a[k.trim()] = v.join('=').trim().replace(/['"]/g, '');
  return a;
}, {});
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Columns:', data && data.length > 0 ? Object.keys(data[0]) : 'No data, but table exists');
  }
}
check();
