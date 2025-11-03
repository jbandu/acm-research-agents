import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { followup_question_id, original_query_id, new_query_id } = await request.json();

    if (!followup_question_id || !original_query_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Insert usage tracking record
    const result = await query(
      `INSERT INTO followup_question_usage
       (followup_question_id, original_query_id, new_query_id, user_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        followup_question_id,
        original_query_id,
        new_query_id || null,
        session.user.email || 'unknown'
      ]
    );

    return NextResponse.json({
      success: true,
      usage_id: result.rows[0].id
    });

  } catch (error: any) {
    console.error('Follow-up question tracking error:', error);
    return NextResponse.json(
      {
        error: 'Failed to track usage',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// POST /api/followup/feedback - Submit effectiveness rating
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { usage_id, effectiveness_rating, led_to_insights, notes } = await request.json();

    if (!usage_id) {
      return NextResponse.json(
        { error: 'Missing usage_id' },
        { status: 400 }
      );
    }

    // Update usage record with feedback
    await query(
      `UPDATE followup_question_usage
       SET effectiveness_rating = $1,
           led_to_insights = $2,
           notes = $3
       WHERE id = $4 AND user_id = $5`,
      [
        effectiveness_rating || null,
        led_to_insights || false,
        notes || null,
        usage_id,
        session.user.email || 'unknown'
      ]
    );

    return NextResponse.json({
      success: true
    });

  } catch (error: any) {
    console.error('Follow-up question feedback error:', error);
    return NextResponse.json(
      {
        error: 'Failed to submit feedback',
        details: error.message
      },
      { status: 500 }
    );
  }
}
