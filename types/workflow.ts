// Workflow Type Definitions

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  domain: string;
  subdomain: string;
  system_prompt: string;
  category: string;
  icon: string;
  prompt_template: string;
  required_parameters: Record<string, ParameterDefinition>;
  example_questions: string[];
  estimated_duration_minutes: number;
  data_sources: string[];
  is_template: boolean;
  use_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface ParameterDefinition {
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'date';
  label?: string;
  required?: boolean;
  default?: any;
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface UserWorkflow {
  id: string;
  user_id?: string;
  template_id: string;
  name: string;
  custom_prompt?: string;
  parameters: Record<string, any>;
  is_favorite: boolean;
  use_count: number;
  created_at: Date;
  last_used?: Date;
  updated_at: Date;
}

export interface WorkflowExecution {
  id: string;
  workflow_id?: string;
  user_workflow_id?: string;
  query_id: string;
  status: 'running' | 'completed' | 'failed';
  execution_time_seconds?: number;
  created_at: Date;
}

export interface WorkflowExecutionRequest {
  workflow_id: string;
  parameters: Record<string, any>;
  query_text: string;
  user_id?: string;
}

export interface WorkflowExecutionResponse {
  execution_id: string;
  query_id: string;
  status: string;
  estimated_completion_time?: Date;
}
