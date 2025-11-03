'use client';

import React, { useCallback, useEffect, useState, useMemo, useRef, memo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  MarkerType,
  NodeTypes,
  useReactFlow,
  ReactFlowProvider
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

// Animated Counter Component
const AnimatedCounter = memo(({ value, duration = 2000 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      setCount(Math.floor(progress * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{count}</span>;
});

AnimatedCounter.displayName = 'AnimatedCounter';

// Custom Node Component with enhanced interactivity
const CustomNode = memo(({ data }: { data: any }) => {
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

  // Calculate connection count for size
  const connectionCount = data.connectionCount || 0;
  const sizeMultiplier = Math.max(1, Math.min(1.5, 1 + connectionCount * 0.05));

  return (
    <div
      className="relative group transition-all duration-300 ease-out"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered ? `scale(${1.05 * sizeMultiplier})` : `scale(${sizeMultiplier})`,
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

            {/* Connection Count Badge */}
            {connectionCount > 0 && (
              <div className="text-xs text-gray-300 mt-1">
                🔗 {connectionCount} connections
              </div>
            )}

            {/* Description */}
            {data.description && (
              <div className="text-xs text-gray-200 line-clamp-2 leading-relaxed mt-2">
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
});

CustomNode.displayName = 'CustomNode';

const nodeTypes: NodeTypes = {
  custom: CustomNode
};

// Main Component
function KnowledgeGraphContent() {
  const [ontologyData, setOntologyData] = useState<OntologyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<OntologyNode | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'force' | 'hierarchical' | 'circular'>('force');

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { fitView } = useReactFlow();

  // Debounced search
  useEffect(() => {
    if (!searchQuery || !ontologyData) {
      setSearchSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      const suggestions = ontologyData.nodes
        .filter(node =>
          node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
        .map(node => node.name);

      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, ontologyData]);

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

  // Calculate connection counts
  const getConnectionCounts = useCallback((data: OntologyData) => {
    const counts = new Map<string, number>();
    data.relationships.forEach(rel => {
      counts.set(rel.source_node_id, (counts.get(rel.source_node_id) || 0) + 1);
      counts.set(rel.target_node_id, (counts.get(rel.target_node_id) || 0) + 1);
    });
    return counts;
  }, []);

  // Transform ontology data to ReactFlow format
  const transformToFlowData = useCallback((data: OntologyData) => {
    const connectionCounts = getConnectionCounts(data);

    // Transform nodes
    const flowNodes: Node[] = data.nodes.map((node, index) => ({
      id: node.id,
      type: 'custom',
      position: getNodePosition(node, index, data.nodes.length, layoutMode),
      data: {
        label: node.name,
        description: node.description,
        nodeType: node.node_type,
        domainName: node.domain_name,
        domainColor: node.domain_color,
        domainIcon: node.domain_icon,
        metadata: node.metadata,
        fullNode: node,
        connectionCount: connectionCounts.get(node.id) || 0
      }
    }));

    // Transform edges with enhanced styling
    const flowEdges: Edge[] = data.relationships.map(rel => ({
      id: rel.id,
      source: rel.source_node_id,
      target: rel.target_node_id,
      label: rel.relationship_type.replace(/_/g, ' '),
      animated: rel.strength > 70,
      type: 'smoothstep',
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
  }, [layoutMode, getConnectionCounts, setNodes, setEdges]);

  // Layout algorithms
  const getNodePosition = (node: OntologyNode, index: number, total: number, mode: string) => {
    if (node.position_x && node.position_y && mode === 'force') {
      return { x: node.position_x, y: node.position_y };
    }

    switch (mode) {
      case 'hierarchical':
        const domainsMap = new Map<string, number>();
        let domainIndex = 0;
        return {
          x: 100 + (index % 5) * 300,
          y: 100 + Math.floor(index / 5) * 200
        };

      case 'circular':
        const angle = (index / total) * 2 * Math.PI;
        const radius = 400;
        return {
          x: 600 + radius * Math.cos(angle),
          y: 400 + radius * Math.sin(angle)
        };

      default: // force
        // Use deterministic positioning based on index to avoid hydration mismatch
        const gridColumns = Math.ceil(Math.sqrt(total));
        const row = Math.floor(index / gridColumns);
        const col = index % gridColumns;
        return {
          x: 100 + col * 150 + (row % 2) * 75,
          y: 100 + row * 150
        };
    }
  };

  // Apply layout
  const applyLayout = useCallback((mode: 'force' | 'hierarchical' | 'circular') => {
    setLayoutMode(mode);
    if (ontologyData) {
      transformToFlowData(ontologyData);
      setTimeout(() => fitView({ duration: 800 }), 100);
    }
  }, [ontologyData, transformToFlowData, fitView]);

  // Handle node click
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data.fullNode);
  }, []);

  // Handle search selection
  const handleSearchSelect = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);

    // Find and select the node
    const node = nodes.find(n => n.data.label === suggestion);
    if (node) {
      setSelectedNode(node.data.fullNode);
      fitView({ nodes: [node], duration: 500, padding: 0.3 });
    }
  };

  // Filter nodes based on search
  const filteredNodes = useMemo(() => {
    if (!searchQuery) return nodes;
    return nodes.filter(node =>
      node.data.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.data.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [nodes, searchQuery]);

  // Domain stats with memoization - Use official domains from acm_domains
  const domainStats = useMemo(() => {
    if (!ontologyData) return [];

    // Create a map of counts per domain_id
    const countsByDomainId = new Map<string, number>();
    ontologyData.nodes.forEach(node => {
      if (node.domain_id) {
        countsByDomainId.set(
          node.domain_id,
          (countsByDomainId.get(node.domain_id) || 0) + 1
        );
      }
    });

    // Return ALL official domains with their counts (0 if no nodes)
    return ontologyData.domains.map(domain => ({
      domain,
      count: countsByDomainId.get(domain.id) || 0
    }));
  }, [ontologyData]);

  // Export functionality
  const exportGraph = useCallback((format: 'png' | 'json') => {
    if (format === 'json') {
      const data = {
        nodes: nodes.map(n => ({ id: n.id, ...n.data })),
        edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target }))
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'knowledge-graph.json';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert('PNG export requires html-to-image library. Would be implemented in production.');
    }
  }, [nodes, edges]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-acm-brand-dark to-slate-900">
        <div className="text-center">
          {/* Animated loader */}
          <div className="relative mx-auto mb-8 w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-acm-brand/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-acm-brand animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-blue-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
          <p className="text-xl font-semibold bg-gradient-to-r from-acm-blue-lighter to-acm-gold-light bg-clip-text text-transparent">
            Loading Knowledge Graph...
          </p>
          <p className="text-sm text-gray-400 mt-2">Visualizing the ACM Biolabs ecosystem</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-acm-brand-dark to-slate-900">
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
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-acm-brand-dark to-slate-800">
        {/* Animated orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-acm-brand/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header - Glassmorphism */}
      <div className="absolute top-0 left-0 right-0 z-10 backdrop-blur-xl bg-slate-900/40 border-b border-white/10 shadow-2xl">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {/* Logo/Icon */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-acm-brand to-acm-gold flex items-center justify-center text-2xl shadow-lg">
                🕸️
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-acm-blue-lighter via-blue-400 to-teal-400 bg-clip-text text-transparent">
                  ACM Biolabs Knowledge Graph
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Interactive visualization • {nodes.length} nodes • {edges.length} connections
                </p>
              </div>
            </div>

            {/* Animated Stats Cards */}
            <div className="flex items-center space-x-4">
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl px-6 py-3 shadow-lg hover:bg-white/10 transition-all duration-300 group">
                <div className="text-xs text-gray-400 mb-1">Total Nodes</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-acm-blue-lighter to-acm-gold-light bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                  <AnimatedCounter value={ontologyData?.stats.totalNodes || 0} />
                </div>
              </div>
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl px-6 py-3 shadow-lg hover:bg-white/10 transition-all duration-300 group">
                <div className="text-xs text-gray-400 mb-1">Relationships</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                  <AnimatedCounter value={ontologyData?.stats.totalRelationships || 0} />
                </div>
              </div>
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl px-6 py-3 shadow-lg hover:bg-white/10 transition-all duration-300 group">
                <div className="text-xs text-gray-400 mb-1">Total Domains</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-green-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                  <AnimatedCounter value={ontologyData?.domains.length || 0} />
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar with Autocomplete */}
          <div className="mb-4 relative">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search nodes by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
                className="w-full px-5 py-3 pl-12 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-acm-brand/50 focus:border-acm-brand/50 transition-all duration-300"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSuggestions(false);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Autocomplete Suggestions */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 backdrop-blur-xl bg-slate-900/90 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                {searchSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearchSelect(suggestion)}
                    className="w-full px-5 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center space-x-3 border-b border-white/5 last:border-b-0"
                  >
                    <svg className="w-4 h-4 text-acm-blue-lighter" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between">
            {/* Domain Filter - Only show domains with nodes */}
            <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-acm-brand/50 scrollbar-track-transparent flex-1 mr-4">
              <button
                onClick={() => setSelectedDomain(null)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex-shrink-0 ${
                  selectedDomain === null
                    ? 'bg-gradient-to-r from-acm-brand-dark to-acm-brand text-white shadow-lg shadow-acm-brand/50'
                    : 'backdrop-blur-md bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                All Domains ({ontologyData?.domains.length || 0})
              </button>
              {ontologyData?.domains.map(domain => {
                // Get count for this domain
                const stat = domainStats.find(s => s.domain.id === domain.id);
                const count = stat?.count || 0;

                return (
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
                    <span className="ml-2 text-xs opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Layout & Export Controls */}
            <div className="flex items-center space-x-2">
              {/* Layout Switcher */}
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-1 flex">
                {(['force', 'hierarchical', 'circular'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => applyLayout(mode)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                      layoutMode === mode
                        ? 'bg-acm-brand-dark text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} Layout`}
                  >
                    {mode === 'force' && '🌐'}
                    {mode === 'hierarchical' && '📊'}
                    {mode === 'circular' && '⭕'}
                  </button>
                ))}
              </div>

              {/* Export Button */}
              <button
                onClick={() => exportGraph('json')}
                className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-300"
                title="Export as JSON"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ReactFlow Graph or Domain Cards View */}
      <div className="h-full pt-64 relative overflow-y-auto">
        {/* Show domain cards grid when no domain is selected */}
        {!selectedDomain && nodes.length === 0 ? (
          <div className="container mx-auto px-8 py-12 pb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-acm-blue-lighter to-acm-gold-light bg-clip-text text-transparent mb-4">
                ACM Research Domains
              </h2>
              <p className="text-gray-400 text-lg">
                Select a domain to explore its knowledge graph and relationships
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {ontologyData?.domains.map(domain => (
                <button
                  key={domain.id}
                  onClick={() => setSelectedDomain(domain.id)}
                  className="group relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-left hover:scale-105 hover:shadow-2xl"
                  style={{
                    boxShadow: `0 0 40px ${domain.color}20`
                  }}
                >
                  {/* Gradient overlay on hover */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(135deg, ${domain.color}, ${domain.color}88)`
                    }}
                  />

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon */}
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl mb-4 transition-transform duration-300 group-hover:scale-110 shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${domain.color}dd, ${domain.color}88)`,
                        boxShadow: `0 0 20px ${domain.color}40`
                      }}
                    >
                      {domain.icon}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-white mb-3">
                      {domain.name}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                      {domain.description}
                    </p>

                    {/* Explore button */}
                    <div className="flex items-center text-sm font-semibold"
                         style={{ color: domain.color }}>
                      <span>Explore Domain</span>
                      <svg className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
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
              <h3 className="font-bold text-lg bg-gradient-to-r from-acm-blue-lighter to-acm-gold-light bg-clip-text text-transparent">
                Domain Statistics
              </h3>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50"></div>
            </div>
            <div className="space-y-3">
              {domainStats.map(({ domain, count }) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between p-3 rounded-xl backdrop-blur-sm bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300 group cursor-pointer"
                  onClick={() => setSelectedDomain(domain.id)}
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
                    <span className="text-2xl font-bold bg-gradient-to-r from-acm-blue-lighter to-acm-gold-light bg-clip-text text-transparent">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </ReactFlow>
          </>
        )}
      </div>

      {/* Enhanced Node Details Sidebar */}
      {selectedNode && (
        <div className="absolute top-64 right-6 w-[420px] backdrop-blur-2xl bg-slate-900/70 border border-white/20 rounded-2xl shadow-2xl p-8 max-h-[calc(100vh-17rem)] overflow-y-auto z-20 animate-slide-in">
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
            {/* Connection Info */}
            <div className="backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/10">
              <h4 className="text-sm font-bold text-purple-300 mb-2 uppercase tracking-wide">Connections</h4>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="text-2xl font-bold text-white">
                  {edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length}
                </span>
                <span className="text-sm text-gray-400">relationships</span>
              </div>
            </div>

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
                      <div className="w-2 h-2 rounded-full bg-acm-blue-lighter mt-1.5 flex-shrink-0"></div>
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

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button className="flex-1 px-4 py-3 bg-gradient-to-r from-acm-brand-dark to-acm-brand text-white rounded-xl hover:from-acm-brand hover:to-blue-500 transition-all duration-300 font-semibold shadow-lg hover:shadow-acm-brand/50">
                View Details
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedNode.name);
                  alert('Node name copied!');
                }}
                className="px-4 py-3 backdrop-blur-md bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white rounded-xl transition-all duration-300"
                title="Copy name"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
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
        .scrollbar-thumb-acm-brand\/50::-webkit-scrollbar-thumb {
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

// Wrapped component with ReactFlowProvider
export function ACMKnowledgeGraph() {
  return (
    <ReactFlowProvider>
      <KnowledgeGraphContent />
    </ReactFlowProvider>
  );
}
