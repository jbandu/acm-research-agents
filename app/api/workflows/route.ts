import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { WorkflowTemplate } from '@/types/workflow';

// GET /api/workflows - List all workflow templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isTemplate = searchParams.get('is_template');

    let queryText = `
      SELECT
        id, name, description, domain, subdomain, system_prompt,
        category, icon, prompt_template, required_parameters,
        example_questions, estimated_duration_minutes, data_sources,
        is_template, use_count, created_at, updated_at
      FROM workflows
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category) {
      params.push(category);
      queryText += ` AND category = $${params.length}`;
    }

    if (isTemplate !== null) {
      params.push(isTemplate === 'true');
      queryText += ` AND is_template = $${params.length}`;
    }

    queryText += ' ORDER BY use_count DESC, name ASC';

    const result = await query(queryText, params);

    const workflows: WorkflowTemplate[] = result.rows;

    return NextResponse.json({
      workflows,
      total: workflows.length,
    });
  } catch (error: any) {
    console.error('Workflows GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

// POST /api/workflows - Create a custom workflow (future: will create user_workflows entry)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      domain,
      subdomain,
      system_prompt,
      category,
      icon,
      prompt_template,
      required_parameters,
      example_questions,
      estimated_duration_minutes,
      data_sources,
    } = body;

    if (!name || !category || !system_prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, system_prompt' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO workflows
       (name, description, domain, subdomain, system_prompt, category, icon,
        prompt_template, required_parameters, example_questions,
        estimated_duration_minutes, data_sources, is_template)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        name,
        description || null,
        domain || 'Custom',
        subdomain || 'Custom',
        system_prompt,
        category,
        icon || '⚙️',
        prompt_template || system_prompt,
        JSON.stringify(required_parameters || {}),
        example_questions || [],
        estimated_duration_minutes || 15,
        JSON.stringify(data_sources || []),
        false, // custom workflows are not templates
      ]
    );

    return NextResponse.json(
      { workflow: result.rows[0] },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Workflows POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create workflow' },
      { status: 500 }
    );
  }
}
