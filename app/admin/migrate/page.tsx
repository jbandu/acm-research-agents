'use client';

import { useState } from 'react';

export default function MigratePage() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'running' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  const [adminSecret, setAdminSecret] = useState('');

  const checkStatus = async () => {
    setStatus('checking');
    setMessage('');

    try {
      const response = await fetch('/api/admin/migrate');
      const data = await response.json();

      if (data.success) {
        setMigrationStatus(data.status);

        if (data.status.allTablesExist) {
          if (data.status.isSeeded) {
            setMessage('✅ All tables exist and data is seeded. Migration already complete!');
            setStatus('success');
          } else {
            setMessage('⚠️ Tables exist but no seed data found. You may need to re-run migration.');
            setStatus('idle');
          }
        } else {
          setMessage(`❌ Missing tables: ${data.status.missingTables.join(', ')}. Migration needed.`);
          setStatus('idle');
        }
      } else {
        setMessage(`❌ Error checking status: ${data.error}`);
        setStatus('error');
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
      setStatus('error');
    }
  };

  const runMigration = async () => {
    if (!adminSecret) {
      setMessage('❌ Please enter the admin secret');
      return;
    }

    setStatus('running');
    setMessage('Running migration...');

    try {
      const response = await fetch('/api/admin/migrate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminSecret}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ ${data.message}`);
        setStatus('success');

        // Recheck status after migration
        setTimeout(checkStatus, 1000);
      } else {
        setMessage(`❌ Migration failed: ${data.error}`);
        setStatus('error');
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ACM Database Migration
          </h1>
          <p className="text-gray-600 mb-8">
            Run the Context Management & Knowledge Graph migration
          </p>

          {/* Status Check Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Check Migration Status</h2>
            <button
              onClick={checkStatus}
              disabled={status === 'checking'}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {status === 'checking' ? 'Checking...' : 'Check Status'}
            </button>

            {migrationStatus && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Current Status:</h3>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-gray-600">Tables exist:</span>
                    <span className={`ml-2 font-medium ${migrationStatus.allTablesExist ? 'text-green-600' : 'text-red-600'}`}>
                      {migrationStatus.allTablesExist ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  {migrationStatus.allTablesExist && (
                    <>
                      <div>
                        <span className="text-gray-600">Knowledge base entries:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {migrationStatus.dataCounts.knowledge_base_entries}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Domains:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {migrationStatus.dataCounts.domains}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Nodes:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {migrationStatus.dataCounts.nodes}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Relationships:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {migrationStatus.dataCounts.relationships}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Migration Section */}
          {migrationStatus && !migrationStatus.allTablesExist && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Run Migration</h2>

              <div className="mb-4">
                <label htmlFor="adminSecret" className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Secret
                </label>
                <input
                  id="adminSecret"
                  type="password"
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  placeholder="Enter ADMIN_SECRET"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is the ADMIN_SECRET environment variable
                </p>
              </div>

              <button
                onClick={runMigration}
                disabled={status === 'running' || !adminSecret}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {status === 'running' ? 'Running Migration...' : 'Run Migration'}
              </button>
            </div>
          )}

          {/* Alternative: Command Line Instructions */}
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Alternative: Command Line</h2>
            <p className="text-gray-600 mb-4">
              You can also run the migration from the command line:
            </p>

            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
              <code className="text-sm">
                # Using Node.js<br />
                node scripts/migrate.js<br />
                <br />
                # Or via API<br />
                curl -X POST http://localhost:3000/api/admin/migrate \<br />
                &nbsp;&nbsp;-H "Authorization: Bearer YOUR_ADMIN_SECRET"
              </code>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Note:</strong> Make sure you have the DATABASE_URL environment variable set.
                For the Node.js script, you can create a .env.local file with your credentials.
              </p>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mt-8 p-4 rounded-lg ${
              status === 'success' ? 'bg-green-50 border border-green-200' :
              status === 'error' ? 'bg-red-50 border border-red-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <p className={`text-sm ${
                status === 'success' ? 'text-green-800' :
                status === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {message}
              </p>
            </div>
          )}

          {/* Next Steps */}
          {status === 'success' && (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3">🎉 Next Steps:</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>Visit the <a href="/ontology" className="underline hover:text-blue-900">Knowledge Graph page</a> to see the visualization</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>Execute a workflow to test context loading</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>Add custom knowledge base entries via the API</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">4.</span>
                  <span>Review the <a href="/CONTEXT_AND_KNOWLEDGE_GRAPH.md" className="underline hover:text-blue-900">documentation</a> for usage details</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
