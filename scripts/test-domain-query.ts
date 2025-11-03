import { query } from '../lib/db';

async function testDomainQuery() {
  console.log('Testing domain selection query...\n');

  // Get Leadership domain
  const domainResult = await query(`
    SELECT id, name FROM acm_domains WHERE name = 'Leadership' LIMIT 1
  `);

  if (domainResult.rows.length === 0) {
    console.log('No Leadership domain found');
    return;
  }

  const domainId = domainResult.rows[0].id;
  console.log('Domain ID:', domainId);
  console.log('Domain Name:', domainResult.rows[0].name);

  // Get nodes for this domain
  const nodesResult = await query(`
    SELECT
      n.*,
      d.name as domain_name,
      d.color as domain_color,
      d.icon as domain_icon
    FROM acm_nodes n
    LEFT JOIN acm_domains d ON n.domain_id = d.id
    WHERE n.domain_id = $1
    ORDER BY n.created_at DESC
  `, [domainId]);

  console.log('\nNodes found:', nodesResult.rows.length);
  nodesResult.rows.forEach((node: any) => {
    console.log(`  - ${node.name} (${node.node_type})`);
  });

  if (nodesResult.rows.length > 0) {
    // Test relationships query
    const nodeIds = nodesResult.rows.map((n: any) => n.id);
    const placeholders = nodeIds.map((_: any, i: number) => `$${i + 1}`).join(',');

    console.log('\nTesting relationships query...');
    console.log('Node IDs count:', nodeIds.length);
    console.log('Placeholders:', placeholders);

    const relationshipsResult = await query(`
      SELECT
        r.*,
        sn.name as source_name,
        tn.name as target_name
      FROM acm_relationships r
      LEFT JOIN acm_nodes sn ON r.source_node_id = sn.id
      LEFT JOIN acm_nodes tn ON r.target_node_id = tn.id
      WHERE r.source_node_id IN (${placeholders})
         OR r.target_node_id IN (${placeholders})
      ORDER BY r.strength DESC, r.created_at DESC
    `, nodeIds);

    console.log('Relationships found:', relationshipsResult.rows.length);
    relationshipsResult.rows.forEach((rel: any) => {
      console.log(`  - ${rel.source_name} → ${rel.target_name} (${rel.relationship_type})`);
    });
  } else {
    console.log('\nNo nodes found, skipping relationships query');
  }
}

testDomainQuery().catch(console.error);
