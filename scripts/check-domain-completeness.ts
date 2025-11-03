import { query } from '../lib/db';

async function checkDomainCompleteness() {
  console.log('Checking domain data completeness...\n');

  const result = await query(`
    SELECT
      id,
      name,
      description,
      icon,
      color,
      display_order,
      CASE
        WHEN description IS NULL THEN 'MISSING'
        WHEN description = '' THEN 'EMPTY'
        ELSE 'OK'
      END as desc_status,
      CASE
        WHEN icon IS NULL THEN 'MISSING'
        WHEN icon = '' THEN 'EMPTY'
        ELSE 'OK'
      END as icon_status,
      CASE
        WHEN color IS NULL THEN 'MISSING'
        WHEN color = '' THEN 'EMPTY'
        ELSE 'OK'
      END as color_status
    FROM acm_domains
    ORDER BY display_order, name
  `);

  console.log('Domain Data Completeness:');
  console.log('=========================\n');

  result.rows.forEach((row: any, index: number) => {
    console.log(`${index + 1}. ${row.name} (order: ${row.display_order})`);
    console.log(`   Icon: ${row.icon_status === 'OK' ? row.icon : `[${row.icon_status}]`}`);
    console.log(`   Color: ${row.color_status === 'OK' ? row.color : `[${row.color_status}]`}`);
    console.log(`   Description: ${row.desc_status === 'OK' ? row.description.substring(0, 50) + '...' : `[${row.desc_status}]`}`);

    const issues = [];
    if (row.icon_status !== 'OK') issues.push('NO ICON');
    if (row.color_status !== 'OK') issues.push('NO COLOR');
    if (row.desc_status !== 'OK') issues.push('NO DESCRIPTION');

    if (issues.length > 0) {
      console.log(`   ⚠️  ISSUES: ${issues.join(', ')}`);
    } else {
      console.log(`   ✅ Complete`);
    }
    console.log('');
  });

  const incomplete = result.rows.filter((row: any) =>
    row.icon_status !== 'OK' || row.color_status !== 'OK' || row.desc_status !== 'OK'
  );

  console.log(`\nSummary: ${result.rows.length} domains, ${incomplete.length} incomplete`);
}

checkDomainCompleteness().catch(console.error);
