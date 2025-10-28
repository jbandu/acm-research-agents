// API Routes for Ontology Node Management
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST /api/ontology/nodes - Create new node
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      domain_id,
      node_type,
      name,
      description,
      metadata = {},
      position_x = 0,
      position_y = 0
    } = body;

    if (!domain_id || !node_type || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: domain_id, node_type, name' },
        { status: 400 }
      );
    }

    const result = await query(`
      INSERT INTO acm_nodes (
        domain_id, node_type, name, description, metadata, position_x, position_y
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      domain_id,
      node_type,
      name,
      description,
      JSON.stringify(metadata),
      position_x,
      position_y
    ]);

    return NextResponse.json({
      success: true,
      node: result.rows[0]
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating node:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/ontology/nodes - Update node
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      domain_id,
      node_type,
      name,
      description,
      metadata,
      position_x,
      position_y
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (domain_id !== undefined) {
      updates.push(`domain_id = $${paramIndex}`);
      params.push(domain_id);
      paramIndex++;
    }
    if (node_type !== undefined) {
      updates.push(`node_type = $${paramIndex}`);
      params.push(node_type);
      paramIndex++;
    }
    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(name);
      paramIndex++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(description);
      paramIndex++;
    }
    if (metadata !== undefined) {
      updates.push(`metadata = $${paramIndex}`);
      params.push(JSON.stringify(metadata));
      paramIndex++;
    }
    if (position_x !== undefined) {
      updates.push(`position_x = $${paramIndex}`);
      params.push(position_x);
      paramIndex++;
    }
    if (position_y !== undefined) {
      updates.push(`position_y = $${paramIndex}`);
      params.push(position_y);
      paramIndex++;
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    params.push(id);
    const result = await query(`
      UPDATE acm_nodes
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, params);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Node not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      node: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating node:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/ontology/nodes?id=<uuid> - Delete node
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    const result = await query(`
      DELETE FROM acm_nodes
      WHERE id = $1
      RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Node not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Node deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting node:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
