import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST /api/newsletter/send - Send newsletter to subscribers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { newsletter_id } = body;

    if (!newsletter_id) {
      return NextResponse.json(
        { success: false, error: 'newsletter_id is required' },
        { status: 400 }
      );
    }

    console.log(`Sending newsletter ${newsletter_id}...`);

    // Get newsletter
    const newsletterResult = await query(
      'SELECT * FROM newsletters WHERE id = $1',
      [newsletter_id]
    );

    if (newsletterResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Newsletter not found' },
        { status: 404 }
      );
    }

    const newsletter = newsletterResult.rows[0];

    if (newsletter.status === 'sent') {
      return NextResponse.json(
        { success: false, error: 'Newsletter already sent' },
        { status: 400 }
      );
    }

    // Get active subscribers
    const subscribersResult = await query(
      'SELECT email, name FROM newsletter_subscriptions WHERE is_active = true'
    );

    const subscribers = subscribersResult.rows;

    if (subscribers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No active subscribers found' },
        { status: 400 }
      );
    }

    console.log(`Found ${subscribers.length} active subscribers`);

    // TODO: Integrate with your email service provider (SendGrid, AWS SES, etc.)
    // For now, this is a placeholder that logs the action

    /*
     * Example integration with SendGrid:
     *
     * import sgMail from '@sendgrid/mail';
     * sgMail.setApiKey(process.env.SENDGRID_API_KEY);
     *
     * const emailPromises = subscribers.map(subscriber => {
     *   return sgMail.send({
     *     to: subscriber.email,
     *     from: 'intelligence@acmbiolabs.com',
     *     subject: newsletter.subject,
     *     html: newsletter.content_html,
     *     text: newsletter.content_markdown
     *   });
     * });
     *
     * await Promise.allSettled(emailPromises);
     */

    // For demonstration, we'll just simulate sending
    console.log('EMAIL SIMULATION - Would send to:');
    subscribers.forEach((sub: any) => {
      console.log(`  - ${sub.name} <${sub.email}>`);
    });
    console.log(`Subject: ${newsletter.subject}`);
    console.log('---');

    // Update newsletter status
    await query(
      `UPDATE newsletters
       SET status = 'sent', sent_at = NOW(), recipient_count = $1
       WHERE id = $2`,
      [subscribers.length, newsletter_id]
    );

    return NextResponse.json({
      success: true,
      message: `Newsletter sent to ${subscribers.length} subscribers`,
      recipients: subscribers.length,
      newsletter_id,
      note: 'Email sending is currently in simulation mode. Configure an email service provider to actually send emails.'
    });
  } catch (error: any) {
    console.error('Newsletter send error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET /api/newsletter/send - Get newsletter subscribers
export async function GET(request: NextRequest) {
  try {
    const result = await query(
      `SELECT email, name, department, is_active, subscribed_at
       FROM newsletter_subscriptions
       ORDER BY subscribed_at DESC`
    );

    return NextResponse.json({
      success: true,
      subscribers: result.rows,
      total: result.rows.length,
      active: result.rows.filter((s: any) => s.is_active).length
    });
  } catch (error: any) {
    console.error('GET /api/newsletter/send error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
