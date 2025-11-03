#!/bin/bash

# Update comprehensive guide to reflect dynamic LLM provider configuration

FILE="ACM_PLATFORM_COMPREHENSIVE_GUIDE.md"

echo "Updating $FILE to reflect dynamic provider configuration..."

# Replace specific text patterns
perl -i -pe '
  s/querying four leading AI models \(Claude Sonnet 4\.5, GPT-4o, Gemini 2\.0 Flash, and Grok 2\)/querying up to five frontier AI models (Claude Sonnet 4.5, GPT-4o, Gemini 2.0 Flash, Grok 2, and optional local Ollama), with admin-configurable provider selection/g;
  s/- \*\*4 AI Models\*\* queried simultaneously/- **Up to 5 Configurable AI Models** (Claude, GPT-4o, Gemini, Grok, Ollama)/g;
  s/four frontier AI models/multiple frontier AI models/g;
  s/Four models/Multiple AI models/g;
  s/4 models provide 4 independent perspectives/Multiple AI models provide independent perspectives/g;
  s/All 4 models receive patent information/All enabled models receive patent information/g;
  s/\(15 minutes for 4 models\)/(15-30 minutes depending on enabled models)/g;
  s/\(via 4 models\)/(via multiple AI models)/g;
  s/15-30 seconds \(4 models in parallel\)/15-30 seconds (all enabled models in parallel)/g;
  s/four frontier AI models with domain-specific/multiple frontier AI models with domain-specific/g;
  s/4 models provide independent analysis/Multiple models provide independent analysis/g;
' "$FILE"

# Add new section about provider configuration
perl -i -pe '
  BEGIN {undef $/;}
  s/(## 10\. Analytics & Reporting.*?---)/\1\n\n## 11. Dynamic Provider Configuration\n\n### What It Does\nAdmin-configurable LLM provider and search source management, allowing dynamic enable\/disable of AI models and research databases without code changes.\n\n### Provider Management\n\n**LLM Providers (up to 5):**\n- Claude Sonnet 4.5 (Anthropic)\n- GPT-4o (OpenAI)\n- Gemini 2.0 Flash (Google)\n- Grok 2 (xAI)\n- Ollama (Local LLM - optional)\n\n**Search Sources:**\n- Google Patents (SerpAPI)\n- More sources can be added via database\n\n### Admin Interface\n\n**Location:** `\/admin\/settings`\n\n**Features:**\n- Toggle switches for each provider\n- Real-time enable\/disable\n- No code deployment required\n- Changes take effect immediately\n- Display order configuration\n- Cost information per provider\n\n### How It Works\n\n**Database-Driven:**\n```sql\nprovider_settings table:\n├─ provider_key (claude, openai, gemini, grok, ollama, google_patents)\n├─ provider_type (llm or search)\n├─ enabled (boolean)\n├─ display_order (integer)\n├─ config (JSONB - model name, costs, etc.)\n```\n\n**Query Execution:**\n1. System fetches enabled providers from database\n2. Only queries enabled LLM models\n3. Only runs enabled search sources\n4. Gracefully handles provider failures\n\n### Business Value\n\n**Flexibility:**\n- Disable expensive models during budget constraints\n- Enable\/disable Ollama for cost-free local queries\n- Turn off patent search if not needed\n- A\/B test different model combinations\n\n**Cost Control:**\n- Instant cost reduction by disabling providers\n- Test with fewer models before scaling\n- Optimize provider mix based on performance\n\n**Future-Proof:**\n- Add new AI models via database insert\n- No code changes required\n- Seamless integration of new providers\n\n---/s;
' "$FILE"

echo "Guide updated successfully!"
echo "Changed instances:"
grep -c "multiple frontier AI models\|Up to 5" "$FILE" || echo "0"
