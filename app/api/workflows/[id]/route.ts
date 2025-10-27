import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/workflows/[id] - Get workflow details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await query(
      `SELECT
        id, name, description, domain, subdomain, system_prompt,
        category, icon, prompt_template, required_parameters,
        example_questions, estimated_duration_minutes, data_sources,
        is_template, use_count, created_at, updated_at
       FROM workflows
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Get recent executions
    const executionsResult = await query(
      `SELECT
        we.id, we.query_id, we.status, we.execution_time_seconds, we.created_at,
        q.query_text, q.status as query_status
       FROM workflow_executions we
       JOIN queries q ON q.id = we.query_id
       WHERE we.workflow_id = $1
       ORDER BY we.created_at DESC
       LIMIT 10`,
      [id]
    );

    return NextResponse.json({
      workflow: result.rows[0],
      recent_executions: executionsResult.rows,
    });
  } catch (error: any) {
    console.error('Workflow GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch workflow' },
      { status: 500 }
    );
  }
}

// PUT /api/workflows/[id] - Update custom workflow
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      description,
      system_prompt,
      icon,
      prompt_template,
      required_parameters,
      example_questions,
      estimated_duration_minutes,
    } = body;

    const result = await query(
      `UPDATE workflows
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           system_prompt = COALESCE($3, system_prompt),
           icon = COALESCE($4, icon),
           prompt_template = COALESCE($5, prompt_template),
           required_parameters = COALESCE($6, required_parameters),
           example_questions = COALESCE($7, example_questions),
           estimated_duration_minutes = COALESCE($8, estimated_duration_minutes),
           updated_at = NOW()
       WHERE id = $9 AND is_template = false
       RETURNING *`,
      [
        name,
        description,
        system_prompt,
        icon,
        prompt_template,
        required_parameters ? JSON.stringify(required_parameters) : null,
        example_questions,
        estimated_duration_minutes,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Workflow not found or cannot be edited' },
        { status: 404 }
      );
    }

    return NextResponse.json({ workflow: result.rows[0] });
  } catch (error: any) {
    console.error('Workflow PUT error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

// DELETE /api/workflows/[id] - Delete custom workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await query(
      'DELETE FROM workflows WHERE id = $1 AND is_template = false RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Workflow not found or cannot be deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id: result.rows[0].id });
  } catch (error: any) {
    console.error('Workflow DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}
