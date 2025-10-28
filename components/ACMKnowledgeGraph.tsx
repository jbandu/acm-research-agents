'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Panel,
  MarkerType,
  NodeTypes,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';

// Types
interface OntologyNode {
  id: string;
  domain_id: string;
  node_type: string;
  name: string;
  description: string;
  metadata: any;
  position_x: number;
  position_y: number;
  domain_name: string;
  domain_color: string;
  domain_icon: string;
}

interface OntologyRelationship {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: string;
  strength: number;
  description: string;
  source_name: string;
  target_name: string;
}

interface Domain {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface OntologyData {
  domains: Domain[];
  nodes: OntologyNode[];
  relationships: OntologyRelationship[];
  stats: any;
}

// Custom Node Component with glassmorphism and animations
const CustomNode = ({ data }: { data: any }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getNodeIcon = (nodeType: string) => {
    const icons: Record<string, string> = {
      person: '👤',
      executive: '👔',
      board: '🎓',
      technology: '🔬',
      program: '🧬',
      trial: '🧪',
      challenge: '⚠️',
      competitor: '🎯',
      partnership: '🤝',
      publication: '📄',
      patent: '⚖️',
      milestone: '🏆'
    };
    return icons[nodeType] || '📍';
  };

  return (
    <div
      className="relative group transition-all duration-300 ease-out"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        filter: isHovered ? 'brightness(1.1)' : 'brightness(1)'
      }}
    >
      {/* Glow effect on hover */}
      {isHovered && (
        <div
          className="absolute inset-0 rounded-xl blur-xl opacity-50 -z-10"
          style={{
            background: `linear-gradient(135deg, ${data.domainColor || '#6366f1'}, ${data.domainColor || '#8b5cf6'})`
          }}
        />
      )}

      {/* Main Node Card - Glassmorphism */}
      <div
        className="px-5 py-4 rounded-xl border backdrop-blur-md min-w-[200px] max-w-[280px] shadow-2xl transition-all duration-300"
        style={{
          background: isHovered
            ? 'rgba(255, 255, 255, 0.15)'
            : 'rgba(255, 255, 255, 0.1)',
          borderColor: data.domainColor || '#6366f1',
          borderWidth: isHovered ? '3px' : '2px',
          borderLeftWidth: '6px',
          boxShadow: isHovered
            ? `0 20px 40px rgba(0,0,0,0.3), 0 0 30px ${data.domainColor}40`
            : '0 10px 30px rgba(0,0,0,0.2)'
        }}
      >
        <div className="flex items-start space-x-3">
          {/* Icon with gradient background */}
          <div
            className="text-3xl flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-transform duration-300"
            style={{
              background: `linear-gradient(135deg, ${data.domainColor || '#6366f1'}dd, ${data.domainColor || '#8b5cf6'}dd)`,
              transform: isHovered ? 'rotate(5deg) scale(1.1)' : 'rotate(0deg) scale(1)'
            }}
          >
            {data.domainIcon || getNodeIcon(data.nodeType)}
          </div>

          <div className="flex-1 min-w-0">
            {/* Node Label */}
            <div className="font-bold text-sm text-white leading-tight mb-1.5 drop-shadow-lg">
              {data.label}
            </div>

            {/* Node Type Badge */}
            <div
              className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-2"
              style={{
                background: `${data.domainColor || '#6366f1'}40`,
                color: '#ffffff',
                backdropFilter: 'blur(10px)'
              }}
            >
              {data.nodeType}
            </div>

            {/* Description */}
            {data.description && (
              <div className="text-xs text-gray-200 line-clamp-2 leading-relaxed">
                {data.description}
              </div>
            )}
          </div>
        </div>

        {/* Animated pulse indicator */}
        <div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
          style={{
            background: `radial-gradient(circle, ${data.domainColor || '#6366f1'}, transparent)`,
            boxShadow: `0 0 10px ${data.domainColor || '#6366f1'}`
          }}
        />
      </div>
    </div>
  );
};

const nodeTypes: NodeTypes = {
  custom: CustomNode
};

export function ACMKnowledgeGraph() {
  const [ontologyData, setOntologyData] = useState<OntologyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<OntologyNode | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Fetch ontology data
  useEffect(() => {
    fetchOntology();
  }, [selectedDomain]);

  const fetchOntology = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = selectedDomain
        ? `/api/ontology?domainId=${selectedDomain}`
        : '/api/ontology';
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setOntologyData(data);
        transformToFlowData(data);
      } else {
        setError(data.error || 'Failed to load ontology');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Transform ontology data to ReactFlow format
  const transformToFlowData = (data: OntologyData) => {
    // Transform nodes
    const flowNodes: Node[] = data.nodes.map(node => ({
      id: node.id,
      type: 'custom',
      position: {
        x: node.position_x || Math.random() * 1000,
        y: node.position_y || Math.random() * 800
      },
      data: {
        label: node.name,
        description: node.description,
        nodeType: node.node_type,
        domainName: node.domain_name,
        domainColor: node.domain_color,
        domainIcon: node.domain_icon,
        metadata: node.metadata,
        fullNode: node
      }
    }));

    // Transform edges with enhanced styling
    const flowEdges: Edge[] = data.relationships.map(rel => ({
      id: rel.id,
      source: rel.source_node_id,
      target: rel.target_node_id,
      label: rel.relationship_type.replace(/_/g, ' '),
      animated: rel.strength > 70,
      style: {
        stroke: rel.strength > 70
          ? 'url(#gradient-strong)'
          : 'rgba(139, 92, 246, 0.4)',
        strokeWidth: Math.max(2, rel.strength / 20),
        filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.5))'
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: rel.strength > 70 ? '#8b5cf6' : 'rgba(139, 92, 246, 0.4)',
        width: 20,
        height: 20
      },
      labelStyle: {
        fill: '#e0e7ff',
        fontSize: 11,
        fontWeight: 600,
        textShadow: '0 0 8px rgba(0,0,0,0.8)'
      },
      labelBgStyle: {
        fill: 'rgba(99, 102, 241, 0.3)',
        fillOpacity: 0.8
      },
      data: {
        description: rel.description,
        strength: rel.strength
      }
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  // Handle node click
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data.fullNode);
  }, []);

  // Filter nodes based on search
  const filteredNodes = useMemo(() => {
    if (!searchQuery) return nodes;
    return nodes.filter(node =>
      node.data.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.data.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [nodes, searchQuery]);

  const domainStats = useMemo(() => {
    if (!ontologyData) return [];

    const stats = new Map<string, { count: number; domain: Domain }>();

    ontologyData.nodes.forEach(node => {
      const domain = ontologyData.domains.find(d => d.id === node.domain_id);
      if (domain) {
        const current = stats.get(domain.id) || { count: 0, domain };
        current.count++;
        stats.set(domain.id, current);
      }
    });

    return Array.from(stats.values());
  }, [ontologyData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          {/* Animated loader */}
          <div className="relative mx-auto mb-8 w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-blue-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
          <p className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Loading Knowledge Graph...
          </p>
          <p className="text-sm text-gray-400 mt-2">Visualizing the ACM Biolabs ecosystem</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md shadow-2xl">
          <div className="text-5xl mb-4 text-center">⚠️</div>
          <h3 className="text-red-300 font-bold text-xl mb-3 text-center">Error Loading Knowledge Graph</h3>
          <p className="text-red-200 text-sm text-center mb-6">{error}</p>
          <button
            onClick={fetchOntology}
            className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-500 hover:to-red-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-red-500/50"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
        {/* Animated orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header - Glassmorphism */}
      <div className="absolute top-0 left-0 right-0 z-10 backdrop-blur-xl bg-slate-900/40 border-b border-white/10 shadow-2xl">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {/* Logo/Icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl shadow-lg">
                🕸️
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400 bg-clip-text text-transparent">
                  ACM Biolabs Knowledge Graph
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Interactive visualization of research entities and relationships
                </p>
              </div>
            </div>

            {/* Stats - Glassmorphism cards */}
            <div className="flex items-center space-x-4">
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl px-6 py-3 shadow-lg">
                <div className="text-xs text-gray-400 mb-1">Nodes</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  {ontologyData?.stats.totalNodes || 0}
                </div>
              </div>
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl px-6 py-3 shadow-lg">
                <div className="text-xs text-gray-400 mb-1">Relationships</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                  {ontologyData?.stats.totalRelationships || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search nodes by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-5 py-3 pl-12 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Domain Filter - Horizontal scroll */}
          <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent">
            <button
              onClick={() => setSelectedDomain(null)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex-shrink-0 ${
                selectedDomain === null
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/50'
                  : 'backdrop-blur-md bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              All Domains
            </button>
            {ontologyData?.domains.map(domain => (
              <button
                key={domain.id}
                onClick={() => setSelectedDomain(domain.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex-shrink-0 ${
                  selectedDomain === domain.id
                    ? 'text-white shadow-lg'
                    : 'backdrop-blur-md bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                }`}
                style={{
                  background: selectedDomain === domain.id
                    ? `linear-gradient(135deg, ${domain.color}, ${domain.color}cc)`
                    : undefined,
                  boxShadow: selectedDomain === domain.id
                    ? `0 0 20px ${domain.color}60`
                    : undefined
                }}
              >
                <span className="mr-2">{domain.icon}</span>
                {domain.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ReactFlow Graph */}
      <div className="h-full pt-56 relative">
        {/* SVG Gradients for edges */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <linearGradient id="gradient-strong" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>

        <ReactFlow
          nodes={searchQuery ? filteredNodes : nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
          className="!bg-transparent"
        >
          <Background
            color="rgba(139, 92, 246, 0.15)"
            gap={20}
            size={1.5}
            style={{ opacity: 0.3 }}
          />
          <Controls className="!bg-slate-800/80 !backdrop-blur-md !border !border-white/10 !rounded-xl !shadow-2xl" />
          <MiniMap
            nodeColor={(node) => node.data.domainColor || '#8b5cf6'}
            maskColor="rgba(0, 0, 0, 0.6)"
            className="!bg-slate-800/80 !backdrop-blur-md !border !border-white/10 !rounded-xl !shadow-2xl"
          />

          {/* Domain Statistics Panel - Glassmorphism */}
          <Panel position="top-right" className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl shadow-2xl p-6 m-4 max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Domain Statistics
              </h3>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50"></div>
            </div>
            <div className="space-y-3">
              {domainStats.map(({ domain, count }) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between p-3 rounded-xl backdrop-blur-sm bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${domain.color}dd, ${domain.color}88)`
                      }}
                    >
                      {domain.icon}
                    </div>
                    <span className="text-gray-200 font-medium">{domain.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Node Details Sidebar - Enhanced Glassmorphism */}
      {selectedNode && (
        <div className="absolute top-56 right-6 w-96 backdrop-blur-2xl bg-slate-900/70 border border-white/20 rounded-2xl shadow-2xl p-8 max-h-[calc(100vh-15rem)] overflow-y-auto z-20 animate-slide-in">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div
                className="text-4xl w-16 h-16 rounded-xl flex items-center justify-center shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${selectedNode.domain_color}dd, ${selectedNode.domain_color}88)`
                }}
              >
                {selectedNode.domain_icon}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{selectedNode.name}</h3>
                <p
                  className="text-sm font-semibold px-3 py-1 rounded-full inline-block"
                  style={{
                    background: `${selectedNode.domain_color}40`,
                    color: '#ffffff'
                  }}
                >
                  {selectedNode.node_type}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div className="backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/10">
              <h4 className="text-sm font-bold text-purple-300 mb-2 uppercase tracking-wide">Description</h4>
              <p className="text-sm text-gray-300 leading-relaxed">{selectedNode.description}</p>
            </div>

            <div className="backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/10">
              <h4 className="text-sm font-bold text-purple-300 mb-3 uppercase tracking-wide">Domain</h4>
              <div
                className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${selectedNode.domain_color}, ${selectedNode.domain_color}cc)`,
                  boxShadow: `0 0 20px ${selectedNode.domain_color}40`
                }}
              >
                <span className="mr-2 text-lg">{selectedNode.domain_icon}</span>
                {selectedNode.domain_name}
              </div>
            </div>

            {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
              <div className="backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 className="text-sm font-bold text-purple-300 mb-3 uppercase tracking-wide">Additional Information</h4>
                <div className="space-y-3">
                  {Object.entries(selectedNode.metadata).map(([key, value]) => (
                    <div key={key} className="flex items-start space-x-2">
                      <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <div className="text-sm text-white mt-0.5">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom CSS for animations */}
      <style jsx global>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .scrollbar-thin::-webkit-scrollbar {
          height: 6px;
        }
        .scrollbar-thumb-purple-500\/50::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 3px;
        }
        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
}
