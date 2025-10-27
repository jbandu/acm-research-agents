import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const result = await query(
      'SELECT * FROM workflows ORDER BY created_at DESC'
    );

    return NextResponse.json({ workflows: result.rows });
  } catch (error: any) {
    console.error('Workflows GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, domain, subdomain, system_prompt, data_sources } = body;

    if (!name || !domain || !subdomain) {
      return NextResponse.json(
        { error: 'Missing required fields: name, domain, subdomain' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO workflows (name, description, domain, subdomain, system_prompt, data_sources) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [name, description, domain, subdomain, system_prompt, JSON.stringify(data_sources || [])]
    );

    return NextResponse.json({ workflow: result.rows[0] });
  } catch (error: any) {
    console.error('Workflows POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
