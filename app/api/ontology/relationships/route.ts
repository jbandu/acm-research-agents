// API Routes for Ontology Relationship Management
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST /api/ontology/relationships - Create new relationship
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      source_node_id,
      target_node_id,
      relationship_type,
      strength = 50,
      description,
      metadata = {}
    } = body;

    if (!source_node_id || !target_node_id || !relationship_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: source_node_id, target_node_id, relationship_type' },
        { status: 400 }
      );
    }

    if (source_node_id === target_node_id) {
      return NextResponse.json(
        { success: false, error: 'Self-referential relationships are not allowed' },
        { status: 400 }
      );
    }

    const result = await query(`
      INSERT INTO acm_relationships (
        source_node_id, target_node_id, relationship_type, strength, description, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      source_node_id,
      target_node_id,
      relationship_type,
      strength,
      description,
      JSON.stringify(metadata)
    ]);

    return NextResponse.json({
      success: true,
      relationship: result.rows[0]
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating relationship:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/ontology/relationships - Update relationship
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      source_node_id,
      target_node_id,
      relationship_type,
      strength,
      description,
      metadata
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

    if (source_node_id !== undefined) {
      updates.push(`source_node_id = $${paramIndex}`);
      params.push(source_node_id);
      paramIndex++;
    }
    if (target_node_id !== undefined) {
      updates.push(`target_node_id = $${paramIndex}`);
      params.push(target_node_id);
      paramIndex++;
    }
    if (relationship_type !== undefined) {
      updates.push(`relationship_type = $${paramIndex}`);
      params.push(relationship_type);
      paramIndex++;
    }
    if (strength !== undefined) {
      updates.push(`strength = $${paramIndex}`);
      params.push(strength);
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

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    params.push(id);
    const result = await query(`
      UPDATE acm_relationships
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, params);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Relationship not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      relationship: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating relationship:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/ontology/relationships?id=<uuid> - Delete relationship
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
      DELETE FROM acm_relationships
      WHERE id = $1
      RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Relationship not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Relationship deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting relationship:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
