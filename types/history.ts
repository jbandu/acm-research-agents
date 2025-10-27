// History Type Definitions

export interface Query {
  id: string;
  workflow_id?: string;
  query_text: string;
  created_by: string;
  status: 'processing' | 'completed' | 'failed';
  created_at: Date;
}

export interface LLMResponse {
  id: string;
  query_id: string;
  llm_provider: 'claude' | 'openai' | 'gemini' | 'grok';
  model_name: string;
  response_text: string;
  confidence_score?: number;
  sources: string[];
  tokens_used?: number;
  response_time_ms: number;
  error?: string;
  created_at: Date;
}

export interface ConsensusResult {
  id: string;
  query_id: string;
  consensus_level: 'high' | 'medium' | 'low' | 'none';
  agreement_summary?: string;
  conflicts: string[];
  agreeing_providers: string[];
  conflicting_providers: string[];
  created_at: Date;
}

export interface QueryWithDetails extends Query {
  responses: LLMResponse[];
  consensus?: ConsensusResult;
  workflow?: {
    id: string;
    name: string;
    category: string;
    icon: string;
  };
  execution?: {
    execution_time_seconds?: number;
  };
  response_count?: number;
  workflow_name?: string;
  workflow_category?: string;
  workflow_icon?: string;
  consensus_level?: string;
  agreeing_providers?: string[];
  conflicting_providers?: string[];
  execution_time_seconds?: number;
}

export interface HistoryFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  workflows?: string[]; // workflow IDs
  categories?: string[]; // workflow categories
  consensusLevels?: ('high' | 'medium' | 'low' | 'none')[];
  llmProviders?: ('claude' | 'openai' | 'gemini' | 'grok')[];
  status?: ('processing' | 'completed' | 'failed')[];
  search?: string;
}

export interface HistoryPaginationParams {
  page: number;
  limit: number;
  sortBy?: 'created_at' | 'last_activity';
  sortOrder?: 'asc' | 'desc';
}

export interface HistoryResponse {
  queries: QueryWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryCollection {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  color?: string;
  query_count?: number;
  created_at: Date;
  updated_at: Date;
}

export interface QueryCollectionItem {
  id: string;
  collection_id: string;
  query_id: string;
  added_at: Date;
}
