'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import ConfirmDialog from '@/components/ConfirmDialog';
import { useToast } from '@/components/ToastProvider';

export default function IntelligenceAdminPage() {
  const { showToast } = useToast();
  const [researching, setResearching] = useState(false);
  const [generatingNewsletter, setGeneratingNewsletter] = useState(false);
  const [researchJobs, setResearchJobs] = useState<any[]>([]);
  const [newsletters, setNewsletters] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<
    | { type: 'weekly-research' }
    | { type: 'send-newsletter'; newsletterId: string }
    | null
  >(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const closeConfirmDialog = () => {
    if (!confirmLoading) {
      setPendingAction(null);
    }
  };

  const requestWeeklyResearch = () => {
    setPendingAction({ type: 'weekly-research' });
  };

  const requestSendNewsletter = (newsletterId: string) => {
    setPendingAction({ type: 'send-newsletter', newsletterId });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [jobsRes, newslettersRes, subsRes] = await Promise.all([
        fetch('/api/research/weekly'),
        fetch('/api/newsletter/generate'),
        fetch('/api/newsletter/send'),
      ]);

      const [jobsData, newslettersData, subsData] = await Promise.all([
        jobsRes.json(),
        newslettersRes.json(),
        subsRes.json(),
      ]);

      if (jobsData.success) setResearchJobs(jobsData.jobs || []);
      if (newslettersData.success) setNewsletters(newslettersData.newsletters || []);
      if (subsData.success) setSubscribers(subsData.subscribers || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast({
        title: 'Unable to load admin data',
        description: 'Check the console for technical details.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const executeWeeklyResearch = async () => {
    setResearching(true);
    try {
      const response = await fetch('/api/research/weekly', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'default-cron-secret'}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        showToast({
          title: 'Research completed',
          description: `Successful: ${data.results.successful}\nFailed: ${data.results.failed}\n\nCompetitors researched:\n${(data.results.researched || []).join('\n')}`,
          variant: 'success',
          duration: 7000,
        });
        fetchData();
      } else {
        showToast({
          title: 'Research failed',
          description: data.error || 'Unable to trigger weekly research.',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Research failed:', error);
      showToast({
        title: 'Research failed',
        description: 'Check the console for technical details.',
        variant: 'error',
      });
    } finally {
      setResearching(false);
    }
  };

  const generateNewsletter = async () => {
    setGeneratingNewsletter(true);
    try {
      const response = await fetch('/api/newsletter/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'default-cron-secret'}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        showToast({
          title: 'Newsletter drafted',
          description: `Subject: ${data.newsletter.subject}\nCompetitors: ${data.newsletter.competitors_covered}\nUpdates: ${data.newsletter.updates_included}\nTrials: ${data.newsletter.trials_highlighted}`,
          variant: 'success',
          duration: 7000,
        });
        fetchData();
      } else {
        showToast({
          title: 'Newsletter generation failed',
          description: data.error || 'Unable to generate the newsletter draft.',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Newsletter generation failed:', error);
      showToast({
        title: 'Newsletter generation failed',
        description: 'Check the console for technical details.',
        variant: 'error',
      });
    } finally {
      setGeneratingNewsletter(false);
    }
  };

  const executeSendNewsletter = async (newsletterId: string) => {
    try {
      const response = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newsletter_id: newsletterId }),
      });

      const data = await response.json();

      if (data.success) {
        showToast({
          title: 'Newsletter sent',
          description: `Delivered to ${data.recipients} subscribers.\n${data.note || ''}`.trim(),
          variant: 'success',
          duration: 6000,
        });
        fetchData();
      } else {
        showToast({
          title: 'Send failed',
          description: data.error || 'Unable to send the newsletter.',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Send failed:', error);
      showToast({
        title: 'Send failed',
        description: 'Check the console for technical details.',
        variant: 'error',
      });
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) {
      return;
    }

    setConfirmLoading(true);
    try {
      if (pendingAction.type === 'weekly-research') {
        await executeWeeklyResearch();
      } else {
        await executeSendNewsletter(pendingAction.newsletterId);
      }
    } finally {
      setConfirmLoading(false);
      setPendingAction(null);
    }
  };

  const confirmMetadata = pendingAction
    ? pendingAction.type === 'weekly-research'
      ? {
          title: 'Run weekly competitor research?',
          description:
            'This will research all active competitors using Claude AI. This may take several minutes and consume API credits.',
          confirmLabel: 'Run research',
        }
      : {
          title: 'Send this newsletter to subscribers?',
          description: 'The latest draft will be emailed to every active subscriber immediately.',
          confirmLabel: 'Send newsletter',
        }
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-acm-brand-dark via-acm-brand to-acm-blue-light flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-acm-brand-dark via-acm-brand to-acm-blue-light">
      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={confirmMetadata?.title ?? ''}
        description={confirmMetadata?.description}
        confirmLabel={confirmMetadata?.confirmLabel}
        onConfirm={handleConfirmAction}
        onCancel={closeConfirmDialog}
        loading={confirmLoading}
      />
      {/* Header */}
      <div className="backdrop-blur-md bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                🤖 Intelligence System Admin
              </h1>
              <p className="text-gray-400">
                Manage automated competitor research and newsletters
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/competitors"
                className="px-4 py-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all"
              >
                View Competitors
              </Link>
              <Link
                href="/"
                className="px-4 py-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all"
              >
                ← Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Weekly Research */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">🔬</div>
              <div>
                <h2 className="text-2xl font-bold text-white">Weekly Research</h2>
                <p className="text-gray-400">Research all competitors with AI</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Last Run:</span>
                <span className="text-white">
                  {researchJobs[0]?.completed_at
                    ? new Date(researchJobs[0].completed_at).toLocaleString()
                    : 'Never'}
                </span>
              </div>
              {researchJobs[0] && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Status:</span>
                    <span className={`font-semibold ${
                      researchJobs[0].status === 'completed' ? 'text-green-400' :
                      researchJobs[0].status === 'failed' ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {researchJobs[0].status}
                    </span>
                  </div>
                  {researchJobs[0].results && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Successful:</span>
                        <span className="text-green-400">{researchJobs[0].results.successful || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Failed:</span>
                        <span className="text-red-400">{researchJobs[0].results.failed || 0}</span>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <button
              onClick={requestWeeklyResearch}
              disabled={researching}
              className="w-full px-6 py-4 bg-gradient-to-r from-acm-gold to-acm-gold-light hover:from-acm-gold-light hover:to-acm-gold text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {researching ? '🔄 Researching... (this may take 2-3 minutes)' : '▶️ Run Weekly Research Now'}
            </button>

            <p className="text-xs text-gray-500 mt-3 text-center">
              This will use Claude AI API credits (~$0.70-$1.00)
            </p>
          </div>

          {/* Newsletter Generation */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">📧</div>
              <div>
                <h2 className="text-2xl font-bold text-white">Newsletter</h2>
                <p className="text-gray-400">Generate weekly intelligence report</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Last Generated:</span>
                <span className="text-white">
                  {newsletters[0]?.created_at
                    ? new Date(newsletters[0].created_at).toLocaleString()
                    : 'Never'}
                </span>
              </div>
              {newsletters[0] && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Status:</span>
                    <span className={`font-semibold ${
                      newsletters[0].status === 'sent' ? 'text-green-400' :
                      newsletters[0].status === 'draft' ? 'text-yellow-400' :
                      'text-gray-400'
                    }`}>
                      {newsletters[0].status}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Competitors:</span>
                    <span className="text-white">{newsletters[0].competitors_covered}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Updates:</span>
                    <span className="text-white">{newsletters[0].updates_included}</span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={generateNewsletter}
              disabled={generatingNewsletter}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingNewsletter ? '🔄 Generating...' : '📝 Generate Newsletter Now'}
            </button>

            <p className="text-xs text-gray-500 mt-3 text-center">
              Uses Claude AI (~$0.02-$0.04)
            </p>
          </div>
        </div>

        {/* Subscriber Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-2">👥</div>
            <div className="text-3xl font-bold text-white mb-1">
              {subscribers.filter(s => s.is_active).length}
            </div>
            <div className="text-sm text-gray-400">Active Subscribers</div>
          </div>

          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-2">📊</div>
            <div className="text-3xl font-bold text-white mb-1">
              {researchJobs.length}
            </div>
            <div className="text-sm text-gray-400">Research Jobs Run</div>
          </div>

          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-2">📰</div>
            <div className="text-3xl font-bold text-white mb-1">
              {newsletters.length}
            </div>
            <div className="text-sm text-gray-400">Newsletters Generated</div>
          </div>

          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-2">📧</div>
            <div className="text-3xl font-bold text-white mb-1">
              {newsletters.filter(n => n.status === 'sent').length}
            </div>
            <div className="text-sm text-gray-400">Newsletters Sent</div>
          </div>
        </div>

        {/* Recent Newsletters */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Recent Newsletters</h3>

          {newsletters.length > 0 ? (
            <div className="space-y-3">
              {newsletters.slice(0, 5).map(newsletter => (
                <div key={newsletter.id} className="flex items-center justify-between p-4 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">{newsletter.subject}</div>
                    <div className="text-sm text-gray-400">
                      Week of {new Date(newsletter.week_start_date).toLocaleDateString()} - {new Date(newsletter.week_end_date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {newsletter.competitors_covered} competitors • {newsletter.updates_included} updates • {newsletter.trials_highlighted} trials
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      newsletter.status === 'sent' ? 'bg-green-500/20 text-green-400' :
                      newsletter.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {newsletter.status}
                      {newsletter.status === 'sent' && ` (${newsletter.recipient_count})`}
                    </span>

                    {newsletter.status === 'draft' && (
                      <button
                        onClick={() => requestSendNewsletter(newsletter.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        Send Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No newsletters generated yet
            </div>
          )}
        </div>

        {/* Setup Instructions */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">⚙️ Setup Instructions</h3>

          <div className="space-y-4 text-sm text-gray-300">
            <div>
              <div className="font-semibold text-white mb-1">1. Environment Variables</div>
              <div className="text-gray-400">
                Ensure <code className="px-2 py-1 bg-black/30 rounded">CLAUDE_API_KEY</code> and{' '}
                <code className="px-2 py-1 bg-black/30 rounded">CRON_SECRET</code> are set in your .env file
              </div>
            </div>

            <div>
              <div className="font-semibold text-white mb-1">2. Schedule Automation</div>
              <div className="text-gray-400">
                Set up weekly cron jobs or use Vercel Cron to automatically run research and generate newsletters.
                See <code className="px-2 py-1 bg-black/30 rounded">COMPETITOR_INTELLIGENCE_SETUP.md</code> for details.
              </div>
            </div>

            <div>
              <div className="font-semibold text-white mb-1">3. Add Subscribers</div>
              <div className="text-gray-400">
                Add employee emails to <code className="px-2 py-1 bg-black/30 rounded">newsletter_subscriptions</code> table
                to receive weekly newsletters
              </div>
            </div>

            <div>
              <div className="font-semibold text-white mb-1">4. Configure Email Service</div>
              <div className="text-gray-400">
                Integrate SendGrid, AWS SES, or another email service provider in{' '}
                <code className="px-2 py-1 bg-black/30 rounded">/app/api/newsletter/send/route.ts</code>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <a
                href="/COMPETITOR_INTELLIGENCE_SETUP.md"
                target="_blank"
                className="inline-flex items-center gap-2 text-yellow-300 hover:text-yellow-200 font-semibold"
              >
                📚 View Full Setup Guide →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
