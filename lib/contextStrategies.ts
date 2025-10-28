// Context Strategy Definitions
// Safe to import in client components - no database dependencies

export type ContextLevel = 'minimal' | 'standard' | 'deep';

export interface ContextStrategy {
  level: ContextLevel;
  maxTokens: number;
  categories: string[];
  description: string;
}

export const CONTEXT_STRATEGIES: Record<ContextLevel, ContextStrategy> = {
  minimal: {
    level: 'minimal',
    maxTokens: 0,
    categories: [],
    description: 'No additional context - just the user query'
  },
  standard: {
    level: 'standard',
    maxTokens: 10000,
    categories: ['company:overview', 'company:challenges', 'people:leadership'],
    description: 'Company basics and leadership (cached, ~10K tokens)'
  },
  deep: {
    level: 'deep',
    maxTokens: 200000,
    categories: [
      'company:overview',
      'company:challenges',
      'people:leadership',
      'research:clinical_trials',
      'competitive:tlr9_landscape',
      'competitive:ai_in_biotech'
    ],
    description: 'Full knowledge base with competitive intelligence (cached, ~200K tokens)'
  }
};
