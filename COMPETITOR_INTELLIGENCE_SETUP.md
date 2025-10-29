# Competitor Intelligence System - Setup Guide

This guide explains how to set up and use the automated competitor intelligence system with weekly research and newsletters.

## Features

✅ **World Map Visualization** - See all competitors on an interactive world map
✅ **Multiple View Modes** - Map, Grid, and List views with advanced filtering
✅ **AI-Powered Research** - Automated competitor research using Claude AI
✅ **Weekly Newsletter** - Automated competitive intelligence newsletter
✅ **Comprehensive Tracking** - Clinical trials, publications, and updates
✅ **Threat Assessment** - Automatic competitive threat scoring

## Database Setup

### 1. Run Migrations

```bash
# From project root
psql $DATABASE_URL -f db/migrations/006_competitors_intelligence.sql
psql $DATABASE_URL -f db/migrations/007_seed_competitors.sql
```

Or use the migration UI at `/admin/migrate`

### 2. Verify Data

Check that competitors are loaded:

```sql
SELECT COUNT(*) FROM competitors;
-- Should return ~20 competitors

SELECT name, headquarters_country, threat_level
FROM competitors
WHERE is_active = true
ORDER BY threat_level DESC;
```

## Environment Variables

Add these to your `.env` file:

```bash
# Claude AI API Key (required for research)
CLAUDE_API_KEY=your-claude-api-key
# or
ANTHROPIC_API_KEY=your-anthropic-api-key

# Cron Job Secret (for securing automated endpoints)
CRON_SECRET=your-secure-random-string

# Optional: Email Service (for newsletter delivery)
SENDGRID_API_KEY=your-sendgrid-key
# or
AWS_SES_ACCESS_KEY=your-aws-key
AWS_SES_SECRET_KEY=your-aws-secret
```

## Manual Usage

### View Competitors

Navigate to `/competitors` to see:
- **World Map** - Interactive map showing all competitor locations
- **Grid View** - Competitor cards with key information
- **List View** - Detailed table with all metrics

### View Competitor Details

Click any competitor to see:
- AI-generated summary and SWOT analysis
- Clinical trials and publications
- Recent updates and news
- Strategic recommendations

### Trigger Manual Research

On any competitor detail page, click **"Run AI Research"** to:
1. Research the competitor using Claude AI
2. Update SWOT analysis
3. Discover new trials and publications
4. Generate strategic recommendations

## Automated Weekly Research

### Option 1: Using Vercel Cron (Recommended for Vercel deployments)

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/research/weekly",
      "schedule": "0 9 * * 1"
    },
    {
      "path": "/api/newsletter/generate",
      "schedule": "0 10 * * 1"
    }
  ]
}
```

**Schedule Explanation:**
- `0 9 * * 1` = Every Monday at 9:00 AM UTC (research)
- `0 10 * * 1` = Every Monday at 10:00 AM UTC (newsletter)

### Option 2: Using External Cron Service

Use a service like **cron-job.org**, **EasyCron**, or **GitHub Actions**:

#### Example: cron-job.org

1. Create account at https://cron-job.org
2. Add two jobs:

**Job 1: Weekly Research**
- URL: `https://your-domain.com/api/research/weekly`
- Method: POST
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`
- Schedule: Every Monday at 9:00 AM

**Job 2: Newsletter Generation**
- URL: `https://your-domain.com/api/newsletter/generate`
- Method: POST
- Headers: `Authorization: Bearer YOUR_CRON_SECRET`
- Schedule: Every Monday at 10:00 AM

#### Example: GitHub Actions

Create `.github/workflows/weekly-research.yml`:

```yaml
name: Weekly Competitor Research

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  research:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Weekly Research
        run: |
          curl -X POST https://your-domain.com/api/research/weekly \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"

      - name: Wait for research to complete
        run: sleep 300

      - name: Generate Newsletter
        run: |
          curl -X POST https://your-domain.com/api/newsletter/generate \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Add `CRON_SECRET` to GitHub repository secrets.

### Option 3: Server Cron (Linux/Unix)

Edit crontab:

```bash
crontab -e
```

Add:

```cron
# Weekly competitor research - Every Monday at 9 AM
0 9 * * 1 curl -X POST https://your-domain.com/api/research/weekly -H "Authorization: Bearer YOUR_CRON_SECRET"

# Newsletter generation - Every Monday at 10 AM
0 10 * * 1 curl -X POST https://your-domain.com/api/newsletter/generate -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Newsletter Setup

### 1. Add Subscribers

Add employee emails to the database:

```sql
INSERT INTO newsletter_subscriptions (email, name, department, is_active)
VALUES
  ('ceo@acmbiolabs.com', 'CEO Name', 'Executive', true),
  ('cto@acmbiolabs.com', 'CTO Name', 'Executive', true),
  ('research@acmbiolabs.com', 'Research Team', 'R&D', true),
  ('clinical@acmbiolabs.com', 'Clinical Team', 'Clinical', true);
```

Or use the API:

```bash
curl -X POST https://your-domain.com/api/newsletter/subscribers \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@acmbiolabs.com",
    "name": "User Name",
    "department": "Department"
  }'
```

### 2. Configure Email Service

#### Option A: SendGrid

```bash
npm install @sendgrid/mail
```

Update `/app/api/newsletter/send/route.ts`:

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const emailPromises = subscribers.map(subscriber => {
  return sgMail.send({
    to: subscriber.email,
    from: 'intelligence@acmbiolabs.com',  // Verify this domain in SendGrid
    subject: newsletter.subject,
    html: newsletter.content_html,
    text: newsletter.content_markdown
  });
});

await Promise.allSettled(emailPromises);
```

#### Option B: AWS SES

```bash
npm install @aws-sdk/client-ses
```

```typescript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ses = new SESClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SES_SECRET_KEY!
  }
});

for (const subscriber of subscribers) {
  await ses.send(new SendEmailCommand({
    Source: 'intelligence@acmbiolabs.com',
    Destination: { ToAddresses: [subscriber.email] },
    Message: {
      Subject: { Data: newsletter.subject },
      Body: {
        Html: { Data: newsletter.content_html },
        Text: { Data: newsletter.content_markdown }
      }
    }
  }));
}
```

### 3. Send Newsletter Manually

After generation, send via API:

```bash
curl -X POST https://your-domain.com/api/newsletter/send \
  -H "Content-Type: application/json" \
  -d '{"newsletter_id": "UUID_FROM_GENERATION"}'
```

Or add a send button in the UI.

## API Endpoints

### Competitors

- `GET /api/competitors` - List all competitors (with filters)
- `GET /api/competitors/[id]` - Get competitor details
- `POST /api/competitors` - Create new competitor
- `PUT /api/competitors/[id]` - Update competitor
- `DELETE /api/competitors/[id]` - Deactivate competitor
- `POST /api/competitors/[id]/research` - Trigger AI research

### Research Jobs

- `POST /api/research/weekly` - Trigger weekly research (requires auth)
- `GET /api/research/weekly` - Get research job history

### Newsletters

- `POST /api/newsletter/generate` - Generate newsletter (requires auth)
- `GET /api/newsletter/generate` - List newsletters
- `POST /api/newsletter/send` - Send newsletter to subscribers
- `GET /api/newsletter/send` - Get subscriber list

## Testing

### 1. Test Manual Research

1. Go to `/competitors`
2. Click any competitor
3. Click "Run AI Research"
4. Wait 30-60 seconds
5. Verify SWOT analysis appears

### 2. Test Weekly Research

```bash
curl -X POST http://localhost:3000/api/research/weekly \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 3. Test Newsletter Generation

```bash
curl -X POST http://localhost:3000/api/newsletter/generate \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Check response for newsletter ID and preview URL.

### 4. View Newsletter

Navigate to `/newsletters` (you may need to create this page) or check the database:

```sql
SELECT id, subject, week_start_date, week_end_date, status
FROM newsletters
ORDER BY created_at DESC
LIMIT 5;
```

## Monitoring

### Check Last Research Dates

```sql
SELECT
  name,
  threat_level,
  last_ai_research_date,
  EXTRACT(DAY FROM NOW() - last_ai_research_date) as days_since_research
FROM competitors
WHERE is_active = true
ORDER BY last_ai_research_date DESC;
```

### Check Newsletter Delivery

```sql
SELECT
  subject,
  week_start_date,
  status,
  sent_at,
  recipient_count
FROM newsletters
ORDER BY created_at DESC
LIMIT 10;
```

### Check Research Job History

```sql
SELECT
  job_type,
  status,
  started_at,
  completed_at,
  results->>'successful' as successful_count,
  results->>'failed' as failed_count
FROM research_jobs
ORDER BY created_at DESC
LIMIT 10;
```

## Cost Estimation

### Claude AI API Costs

- **Per Competitor Research**: ~3,000-5,000 tokens (~$0.03-$0.05)
- **Weekly Research (20 competitors)**: ~$0.60-$1.00
- **Newsletter Generation**: ~2,000-4,000 tokens (~$0.02-$0.04)
- **Total Weekly Cost**: ~$0.70-$1.10

Monthly cost: ~$3-5

### Email Delivery Costs

- **SendGrid**: Free tier includes 100 emails/day
- **AWS SES**: $0.10 per 1,000 emails
- For 50 employees weekly: <$1/month

## Troubleshooting

### Issue: Research fails with "Unauthorized"

**Solution**: Set `CLAUDE_API_KEY` or `ANTHROPIC_API_KEY` in `.env`

### Issue: Cron job returns 401

**Solution**: Ensure `Authorization: Bearer YOUR_CRON_SECRET` header matches `CRON_SECRET` in `.env`

### Issue: Newsletter not sending

**Solution**:
1. Check subscriber list: `GET /api/newsletter/send`
2. Verify email service configuration
3. Check email service logs/dashboard

### Issue: Map not loading

**Solution**:
1. Verify competitors have latitude/longitude
2. Check browser console for errors
3. Ensure Leaflet CSS is loaded

### Issue: Research taking too long

**Solution**:
- Research runs sequentially with 2s delay between competitors
- For 20 competitors: ~2-3 minutes total
- Consider reducing competitor count or running in batches

## Customization

### Add More Competitors

```sql
INSERT INTO competitors (
  name, short_name, website_url,
  headquarters_city, headquarters_country, latitude, longitude,
  threat_level, competitive_overlap_score,
  primary_focus, technology_platforms
) VALUES (
  'New Competitor Inc.',
  'NewComp',
  'https://newcompetitor.com',
  'Boston',
  'United States',
  42.3601,
  -71.0589,
  'medium',
  60,
  ARRAY['Immunotherapy', 'Cancer Vaccines'],
  ARRAY['mRNA', 'Peptides']
);
```

### Customize Newsletter Schedule

Edit cron schedule in your chosen method:
- Daily: `0 9 * * *`
- Bi-weekly: `0 9 * * 1,4` (Mon & Thu)
- Monthly: `0 9 1 * *` (1st of month)

### Customize Research Prompt

Edit `/app/api/competitors/[id]/research/route.ts` to modify the AI research prompt.

### Add Custom Metrics

Extend the `competitors` table:

```sql
ALTER TABLE competitors ADD COLUMN custom_metric VARCHAR(255);
```

Update UI components to display new fields.

## Support

For issues or questions:
1. Check logs: `vercel logs` or server logs
2. Verify environment variables
3. Test API endpoints manually
4. Check Claude API usage/limits
5. Review database query logs

## Next Steps

1. ✅ Run migrations and verify data
2. ✅ Set up environment variables
3. ✅ Test manual competitor research
4. ✅ Configure cron jobs for automation
5. ✅ Add employee email subscriptions
6. ✅ Configure email service provider
7. ✅ Test weekly research and newsletter
8. 🚀 Deploy and monitor

---

**Built with Claude AI for ACM Biolabs**
