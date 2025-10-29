import { query } from '../lib/db';

async function testAPI() {
  console.log('Testing API query for domains...\n');

  const domainsResult = await query(`
    SELECT * FROM acm_domains
    WHERE display_order <= 15 OR display_order IS NULL
    ORDER BY display_order, name
    LIMIT 15
  `);

  console.log('Domains found:', domainsResult.rows.length);
  console.log('\nDomains:');
  domainsResult.rows.forEach((domain: any) => {
    console.log(`  - ${domain.name} (display_order: ${domain.display_order})`);
  });
}

testAPI().catch(console.error);
