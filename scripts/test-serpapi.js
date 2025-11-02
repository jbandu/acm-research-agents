#!/usr/bin/env node

/**
 * Test script to verify SerpAPI connection for Google Patents
 * Run: node scripts/test-serpapi.js
 */

require('dotenv').config({ path: '.env.local' });
const { getJson } = require('serpapi');

async function testSerpAPI() {
  console.log('🔍 SerpAPI Connection Test\n');
  console.log('═══════════════════════════════════════\n');

  // Check if API key is configured
  if (!process.env.SERPAPI_KEY) {
    console.error('❌ ERROR: SERPAPI_KEY not found in environment variables');
    console.error('');
    console.error('Please add SERPAPI_KEY to your .env.local file:');
    console.error('SERPAPI_KEY=your_api_key_here');
    console.error('');
    console.error('Get your API key from: https://serpapi.com/dashboard');
    process.exit(1);
  }

  console.log('✅ API Key found (length: ' + process.env.SERPAPI_KEY.length + ' chars)');
  console.log('');

  // Test query
  const testQuery = 'cancer immunotherapy TLR9';
  console.log(`🔬 Testing Google Patents search...`);
  console.log(`   Query: "${testQuery}"`);
  console.log('');

  try {
    const startTime = Date.now();

    const response = await getJson({
      engine: 'google_patents',
      q: testQuery,
      api_key: process.env.SERPAPI_KEY,
      num: 5, // Just get 5 for testing
    });

    const duration = Date.now() - startTime;

    if (!response) {
      throw new Error('No response from SerpAPI');
    }

    if (response.error) {
      throw new Error(`SerpAPI Error: ${response.error}`);
    }

    if (!response.organic_results || response.organic_results.length === 0) {
      console.log('⚠️  No patent results found for this query');
      console.log('   This is normal for very specific queries');
      console.log('   Try a broader search term');
      console.log('');
      console.log('✅ Connection successful (but no results)');
      return;
    }

    console.log(`✅ Found ${response.organic_results.length} patents (in ${duration}ms)\n`);
    console.log('═══════════════════════════════════════\n');

    // Display first patent
    const firstPatent = response.organic_results[0];
    console.log('📜 Sample Patent:\n');
    console.log(`   Patent Number: ${firstPatent.patent_id || 'N/A'}`);
    console.log(`   Title: ${firstPatent.title || 'N/A'}`);
    console.log(`   Assignee: ${firstPatent.assignee || 'N/A'}`);
    console.log(`   Publication Date: ${firstPatent.publication_date || firstPatent.filing_date || 'N/A'}`);
    console.log(`   Link: ${firstPatent.link || 'N/A'}`);

    if (firstPatent.snippet) {
      console.log(`   Snippet: ${firstPatent.snippet.substring(0, 150)}...`);
    }

    console.log('');
    console.log('═══════════════════════════════════════\n');

    // Show all patent numbers
    console.log('📋 All Patents Found:\n');
    response.organic_results.forEach((patent, index) => {
      console.log(`   ${index + 1}. ${patent.patent_id || 'Unknown'} - ${patent.assignee || 'Unknown'}`);
    });

    console.log('');
    console.log('═══════════════════════════════════════\n');
    console.log('✅ CONNECTION SUCCESSFUL!\n');
    console.log('Your SerpAPI integration is working correctly.');
    console.log('Patents will now appear in your query results.\n');

    // Show usage info
    if (response.search_metadata) {
      console.log('📊 API Usage Info:\n');
      console.log(`   Search ID: ${response.search_metadata.id}`);
      console.log(`   Response Time: ${duration}ms`);
      console.log('');
    }

    console.log('💡 Next Steps:\n');
    console.log('   1. Run a query in your application');
    console.log('   2. Look for the "Patent Intelligence" section');
    console.log('   3. Check your SerpAPI dashboard for usage stats');
    console.log('   4. Consider upgrading plan if you hit limits');
    console.log('');

  } catch (error) {
    console.error('❌ TEST FAILED\n');
    console.error(`Error: ${error.message}\n`);

    if (error.message.includes('Invalid API key')) {
      console.error('🔧 Solution:');
      console.error('   1. Check your API key in .env.local');
      console.error('   2. Get correct key from: https://serpapi.com/dashboard');
      console.error('   3. Make sure there are no extra spaces');
      console.error('');
    } else if (error.message.includes('Rate limit')) {
      console.error('🔧 Solution:');
      console.error('   1. You\'ve used all your free searches (100/month)');
      console.error('   2. Upgrade to paid plan: https://serpapi.com/pricing');
      console.error('   3. Or wait until next month for reset');
      console.error('');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('network')) {
      console.error('🔧 Solution:');
      console.error('   1. Check your internet connection');
      console.error('   2. Check if serpapi.com is accessible');
      console.error('   3. Try again in a few moments');
      console.error('');
    } else {
      console.error('🔧 Debug Info:');
      console.error(error);
      console.error('');
    }

    process.exit(1);
  }
}

// Run the test
testSerpAPI().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
