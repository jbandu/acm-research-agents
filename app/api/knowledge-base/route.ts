// API Routes for ACM Knowledge Base Management
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { loadACMContext, CONTEXT_STRATEGIES, type ContextLevel } from '@/lib/contextLoader';

// GET /api/knowledge-base - List all knowledge base entries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const subcategory = searchParams.get('subcategory');
    const minImportance = searchParams.get('minImportance');

    let sql = 'SELECT * FROM acm_knowledge_base WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      sql += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (subcategory) {
      sql += ` AND subcategory = $${paramIndex}`;
      params.push(subcategory);
      paramIndex++;
    }

    if (minImportance) {
      sql += ` AND importance_score >= $${paramIndex}`;
      params.push(parseInt(minImportance));
      paramIndex++;
    }

    sql += ' ORDER BY importance_score DESC, created_at DESC';

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      entries: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching knowledge base:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/knowledge-base - Create new knowledge base entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      category,
      subcategory,
      title,
      content,
      metadata = {},
      importance_score = 50,
      token_count
    } = body;

    if (!category || !title || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: category, title, content' },
        { status: 400 }
      );
    }

    // Estimate token count if not provided
    const estimatedTokens = token_count || Math.ceil(content.length / 4);

    const result = await query(`
      INSERT INTO acm_knowledge_base (
        category, subcategory, title, content, metadata,
        importance_score, token_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      category,
      subcategory,
      title,
      content,
      JSON.stringify(metadata),
      importance_score,
      estimatedTokens
    ]);

    return NextResponse.json({
      success: true,
      entry: result.rows[0]
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating knowledge base entry:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/knowledge-base - Update existing entry
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      category,
      subcategory,
      title,
      content,
      metadata,
      importance_score,
      token_count
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (category !== undefined) {
      updates.push(`category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }
    if (subcategory !== undefined) {
      updates.push(`subcategory = $${paramIndex}`);
      params.push(subcategory);
      paramIndex++;
    }
    if (title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      params.push(title);
      paramIndex++;
    }
    if (content !== undefined) {
      updates.push(`content = $${paramIndex}`);
      params.push(content);
      paramIndex++;
      // Update token count if content changes
      const estimatedTokens = Math.ceil(content.length / 4);
      updates.push(`token_count = $${paramIndex}`);
      params.push(estimatedTokens);
      paramIndex++;
    }
    if (metadata !== undefined) {
      updates.push(`metadata = $${paramIndex}`);
      params.push(JSON.stringify(metadata));
      paramIndex++;
    }
    if (importance_score !== undefined) {
      updates.push(`importance_score = $${paramIndex}`);
      params.push(importance_score);
      paramIndex++;
    }
    if (token_count !== undefined) {
      updates.push(`token_count = $${paramIndex}`);
      params.push(token_count);
      paramIndex++;
    }

    updates.push(`last_updated = NOW()`);

    if (updates.length === 1) { // Only the timestamp update
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    params.push(id);
    const result = await query(`
      UPDATE acm_knowledge_base
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, params);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      entry: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating knowledge base entry:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/knowledge-base?id=<uuid> - Delete entry
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
      DELETE FROM acm_knowledge_base
      WHERE id = $1
      RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Entry deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting knowledge base entry:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
