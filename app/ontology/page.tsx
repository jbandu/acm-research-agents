'use client';

import dynamic from 'next/dynamic';

// Dynamically import the Knowledge Graph component to avoid SSR issues
const ACMKnowledgeGraph = dynamic(
  () => import('@/components/ACMKnowledgeGraph').then(mod => ({ default: mod.ACMKnowledgeGraph })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="relative mx-auto mb-8 w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-blue-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
          <p className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Loading Knowledge Graph...
          </p>
        </div>
      </div>
    )
  }
);

export default function OntologyPage() {
  return <ACMKnowledgeGraph />;
}
