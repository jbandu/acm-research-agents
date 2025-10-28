import { ACMKnowledgeGraph } from '@/components/ACMKnowledgeGraph';

export const metadata = {
  title: 'ACM Knowledge Graph | ACM Research Agents',
  description: 'Interactive visualization of ACM Biolabs research entities and relationships'
};

export default function OntologyPage() {
  return <ACMKnowledgeGraph />;
}
