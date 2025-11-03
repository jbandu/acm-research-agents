import { query } from '../lib/db';

async function countNodesPerDomain() {
  console.log('Counting nodes per domain...\n');

  const result = await query(`
    SELECT
      d.name as domain_name,
      d.display_order,
      COUNT(n.id) as node_count
    FROM acm_domains d
    LEFT JOIN acm_nodes n ON d.id = n.domain_id
    GROUP BY d.id, d.name, d.display_order
    ORDER BY d.display_order, d.name
  `);

  console.log('Domain Node Counts:');
  console.log('-------------------');
  result.rows.forEach((row: any) => {
    console.log(`${row.domain_name}: ${row.node_count} nodes`);
  });

  const totalNodes = result.rows.reduce((sum: number, row: any) => sum + parseInt(row.node_count), 0);
  console.log('\n-------------------');
  console.log(`Total nodes across all domains: ${totalNodes}`);
}

countNodesPerDomain().catch(console.error);
