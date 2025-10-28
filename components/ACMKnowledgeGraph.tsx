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

// Custom Node Component with enhanced styling
const CustomNode = ({ data }: { data: any }) => {
  const getNodeIcon = (nodeType: string) => {
    const icons: Record<string, string> = {
      person: '👤',
      technology: '🔬',
      trial: '🧪',
      challenge: '⚠️',
      competitor: '🎯',
      partnership: '🤝',
      publication: '📄'
    };
    return icons[nodeType] || '📍';
  };

  return (
    <div
      className="px-4 py-3 shadow-lg rounded-lg border-2 min-w-[180px] max-w-[250px] bg-white"
      style={{
        borderColor: data.domainColor || '#6B7280',
        borderLeftWidth: '4px'
      }}
    >
      <div className="flex items-start space-x-2">
        <div className="text-2xl flex-shrink-0">
          {data.domainIcon || getNodeIcon(data.nodeType)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-900 leading-tight mb-1">
            {data.label}
          </div>
          <div className="text-xs text-gray-600 mb-2">
            {data.nodeType}
          </div>
          {data.description && (
            <div className="text-xs text-gray-500 line-clamp-2">
              {data.description}
            </div>
          )}
        </div>
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
  const [layoutMode, setLayoutMode] = useState<'force' | 'hierarchical'>('force');

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
        x: node.position_x || Math.random() * 800,
        y: node.position_y || Math.random() * 600
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

    // Transform edges
    const flowEdges: Edge[] = data.relationships.map(rel => ({
      id: rel.id,
      source: rel.source_node_id,
      target: rel.target_node_id,
      label: rel.relationship_type.replace(/_/g, ' '),
      animated: rel.strength > 70,
      style: {
        stroke: rel.strength > 70 ? '#3B82F6' : '#9CA3AF',
        strokeWidth: Math.max(1, rel.strength / 25)
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: rel.strength > 70 ? '#3B82F6' : '#9CA3AF'
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

  // Export graph as image
  const exportAsImage = async () => {
    // This would require additional library like html-to-image
    // For now, just show a message
    alert('Export functionality would be implemented with html-to-image library');
  };

  // Apply layout
  const applyLayout = useCallback((mode: 'force' | 'hierarchical') => {
    if (mode === 'hierarchical') {
      // Simple hierarchical layout
      const nodesByLevel: Record<number, OntologyNode[]> = {};

      // Group nodes by domain for hierarchical layout
      const domainGroups = new Map<string, OntologyNode[]>();
      ontologyData?.nodes.forEach(node => {
        const group = domainGroups.get(node.domain_id) || [];
        group.push(node);
        domainGroups.set(node.domain_id, group);
      });

      let yOffset = 50;
      const updatedNodes = [...nodes];

      domainGroups.forEach((domainNodes, domainId) => {
        domainNodes.forEach((node, idx) => {
          const flowNode = updatedNodes.find(n => n.id === node.id);
          if (flowNode) {
            flowNode.position = {
              x: 100 + (idx * 300),
              y: yOffset
            };
          }
        });
        yOffset += 200;
      });

      setNodes(updatedNodes);
    }
  }, [nodes, ontologyData]);

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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ACM Knowledge Graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Knowledge Graph</h3>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={fetchOntology}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gray-50 relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <span className="mr-2">🕸️</span>
                ACM Biolabs Knowledge Graph
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Interactive visualization of research entities and relationships
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-gray-600">Nodes:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {ontologyData?.stats.totalNodes || 0}
                </span>
                <span className="text-gray-400 mx-2">|</span>
                <span className="text-gray-600">Relationships:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {ontologyData?.stats.totalRelationships || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Domain Filter */}
          <div className="flex items-center space-x-2 mt-4">
            <button
              onClick={() => setSelectedDomain(null)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedDomain === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Domains
            </button>
            {ontologyData?.domains.map(domain => (
              <button
                key={domain.id}
                onClick={() => setSelectedDomain(domain.id)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedDomain === domain.id
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: selectedDomain === domain.id ? domain.color : undefined
                }}
              >
                <span className="mr-1">{domain.icon}</span>
                {domain.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ReactFlow Graph */}
      <div className="h-full pt-32">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
        >
          <Background color="#e5e7eb" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              return node.data.domainColor || '#6B7280';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />

          {/* Custom Panel */}
          <Panel position="top-right" className="bg-white rounded-lg shadow-lg p-4 m-4 max-w-xs">
            <h3 className="font-semibold text-sm text-gray-900 mb-2">Domain Statistics</h3>
            <div className="space-y-2">
              {domainStats.map(({ domain, count }) => (
                <div key={domain.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <span className="mr-2">{domain.icon}</span>
                    <span className="text-gray-700">{domain.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Node Details Sidebar */}
      {selectedNode && (
        <div className="absolute top-32 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 p-6 max-h-[calc(100vh-9rem)] overflow-y-auto z-20">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">{selectedNode.domain_icon}</div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedNode.name}</h3>
                <p className="text-sm text-gray-600">{selectedNode.node_type}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Description</h4>
              <p className="text-sm text-gray-600">{selectedNode.description}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Domain</h4>
              <div
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: selectedNode.domain_color }}
              >
                <span className="mr-1">{selectedNode.domain_icon}</span>
                {selectedNode.domain_name}
              </div>
            </div>

            {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Additional Information</h4>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  {Object.entries(selectedNode.metadata).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="text-gray-600 font-medium capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
