// API Routes for ACM Ontology / Knowledge Graph
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/ontology - Get complete ontology (domains, nodes, relationships)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domainId');
    const nodeType = searchParams.get('nodeType');

    // Fetch domains
    const domainsResult = await query(`
      SELECT * FROM acm_domains
      ORDER BY display_order, name
    `);

    // Fetch nodes with optional filtering
    let nodesSql = `
      SELECT
        n.*,
        d.name as domain_name,
        d.color as domain_color,
        d.icon as domain_icon
      FROM acm_nodes n
      LEFT JOIN acm_domains d ON n.domain_id = d.id
      WHERE 1=1
    `;
    const nodesParams: any[] = [];
    let paramIndex = 1;

    if (domainId) {
      nodesSql += ` AND n.domain_id = $${paramIndex}`;
      nodesParams.push(domainId);
      paramIndex++;
    }

    if (nodeType) {
      nodesSql += ` AND n.node_type = $${paramIndex}`;
      nodesParams.push(nodeType);
      paramIndex++;
    }

    nodesSql += ' ORDER BY n.created_at DESC';

    const nodesResult = await query(nodesSql, nodesParams);

    // Fetch relationships
    const relationshipsResult = await query(`
      SELECT
        r.*,
        sn.name as source_name,
        tn.name as target_name
      FROM acm_relationships r
      LEFT JOIN acm_nodes sn ON r.source_node_id = sn.id
      LEFT JOIN acm_nodes tn ON r.target_node_id = tn.id
      ORDER BY r.strength DESC, r.created_at DESC
    `);

    // Calculate statistics
    const stats = {
      totalDomains: domainsResult.rows.length,
      totalNodes: nodesResult.rows.length,
      totalRelationships: relationshipsResult.rows.length,
      nodesByType: nodesResult.rows.reduce((acc: any, node: any) => {
        acc[node.node_type] = (acc[node.node_type] || 0) + 1;
        return acc;
      }, {}),
      relationshipsByType: relationshipsResult.rows.reduce((acc: any, rel: any) => {
        acc[rel.relationship_type] = (acc[rel.relationship_type] || 0) + 1;
        return acc;
      }, {})
    };

    return NextResponse.json({
      success: true,
      domains: domainsResult.rows,
      nodes: nodesResult.rows,
      relationships: relationshipsResult.rows,
      stats
    });
  } catch (error: any) {
    console.error('Error fetching ontology:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
