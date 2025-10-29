import { query } from '../lib/db';

async function checkDomains() {
  const result = await query('SELECT id, name, display_order FROM acm_domains ORDER BY display_order, name');
  console.log('Total domains:', result.rows.length);
  console.log(JSON.stringify(result.rows, null, 2));
}

checkDomains().catch(console.error);
