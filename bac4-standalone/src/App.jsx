import { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import useStore from './store';
import { getType } from './config/elementTypes';
import C4Node from './components/C4Node';
import ERCrowEdge from './components/ERCrowEdge';
import FieldEditorPanel from './components/FieldEditorPanel';
import WorkspaceNav from './components/WorkspaceNav';
import BoundedContextCanvasView from './components/BoundedContextCanvasView';
import Toolbar from './components/Toolbar';
import PropertiesPanel from './components/PropertiesPanel';
import Header from './components/Header';
import { useLocalStorage } from './hooks/useLocalStorage';

const nodeTypes = {
  c4Node: C4Node,
};

const edgeTypes = {
  erCrow: ERCrowEdge,
};

// Calculate optimal handles based on node positions for shortest edge path
const getOptimalHandles = (sourceNode, targetNode) => {
  if (!sourceNode?.position || !targetNode?.position) {
    return { sourceHandle: 'bottom', targetHandle: 'top' };
  }

  const dx = targetNode.position.x - sourceNode.position.x;
  const dy = targetNode.position.y - sourceNode.position.y;

  // Use horizontal handles if nodes are more side-by-side than stacked
  if (Math.abs(dx) > Math.abs(dy)) {
    // Target is to the right of source
    if (dx > 0) {
      return { sourceHandle: 'right', targetHandle: 'left' };
    }
    // Target is to the left of source
    return { sourceHandle: 'left', targetHandle: 'right' };
  }

  // Use vertical handles if nodes are more stacked
  // Target is below source
  if (dy > 0) {
    return { sourceHandle: 'bottom', targetHandle: 'top' };
  }
  // Target is above source
  return { sourceHandle: 'top', targetHandle: 'bottom' };
};

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const {
    getAllElements,
    relationships,
    updateElement,
    setSelectedElement,
    setSelectedEdge,
    drillInto,
  } = useStore();

  // Custom handler to intercept dimension changes
  const handleNodesChange = useCallback((changes) => {
    // Apply changes to React Flow
    onNodesChange(changes);

    // DISABLED: Dimension tracking for annotations causes infinite loops
    // TODO: Fix this properly later
    // For now, annotations will not persist their size on refresh
  }, [onNodesChange]);

  // Subscribe to the single elements array + drill path to trigger re-renders
  const elements = useStore((state) => state.elements);
  const drillPath = useStore((state) => state.drillPath);
  const currentView = useStore((state) => state.currentView);
  const getVisibleElements = useStore((state) => state.getVisibleElements);

  // Enable local storage auto-save
  useLocalStorage();

  // Update nodes and edges when store changes
  useEffect(() => {
    const elements = getVisibleElements();
    const newNodes = elements.map((el) => ({
      id: el.id,
      type: 'c4Node',
      position: el.position || { x: Math.random() * 400, y: Math.random() * 300 },
      data: {
        ...el,
        label: el.name,
      },
    }));
    setNodes(newNodes);
  }, [elements, drillPath, getVisibleElements, setNodes]);

  useEffect(() => {
    const elements = getVisibleElements();
    const newEdges = relationships.map((rel) => {
      // Determine arrow markers based on arrowDirection
      const arrowDirection = rel.arrowDirection || 'right';
      let markerStart = undefined;
      let markerEnd = undefined;

      if (arrowDirection === 'left' || arrowDirection === 'both') {
        markerStart = { type: MarkerType.ArrowClosed };
      }
      if (arrowDirection === 'right' || arrowDirection === 'both') {
        markerEnd = { type: MarkerType.ArrowClosed };
      }

      // Determine line style based on lineStyle
      const lineStyle = rel.lineStyle || 'solid';
      let strokeDasharray = undefined;
      if (lineStyle === 'dashed') {
        strokeDasharray = '5,5';
      } else if (lineStyle === 'dotted') {
        strokeDasharray = '2,2';
      }

      // Calculate optimal handles based on node positions
      const sourceNode = elements.find((el) => el.id === rel.from);
      const targetNode = elements.find((el) => el.id === rel.to);
      const { sourceHandle, targetHandle } = getOptimalHandles(sourceNode, targetNode);

      const isER = !!rel.cardinality;
      return {
        id: rel.id,
        source: rel.from,
        target: rel.to,
        sourceHandle,
        targetHandle,
        label: (currentView === 'domain-story' && rel.sequence != null)
          ? `${rel.sequence}. ${rel.description || ''}`
          : (rel.description || ''),
        type: isER ? 'erCrow' : 'smoothstep',
        data: isER ? { cardinality: rel.cardinality } : undefined,
        animated: rel.animated || false,
        markerStart: isER ? undefined : markerStart,
        markerEnd: isER ? undefined : markerEnd,
        style: {
          stroke: '#64748b',
          strokeWidth: 2,
          strokeDasharray,
        },
        labelStyle: {
          fill: '#334155',
          fontSize: 12,
          fontWeight: 500,
        },
        labelBgStyle: {
          fill: '#f8fafc',
          fillOpacity: 0.9,
        },
      };
    });
    setEdges(newEdges);
  }, [relationships, setEdges, getVisibleElements, elements, drillPath, currentView]);

  // 下钻/返回时自动适配视图，让当前层内容居中显示
  useEffect(() => {
    if (!reactFlowInstance) return;
    const t = setTimeout(() => reactFlowInstance.fitView({ padding: 0.2, duration: 300 }), 60);
    return () => clearTimeout(t);
  }, [drillPath, currentView, reactFlowInstance]);

  // Handle node drag
  const onNodeDragStop = useCallback(
    (event, node) => {
      const element = getAllElements().find((el) => el.id === node.id);
      if (element) {
        // Extract only x and y to avoid any circular references from React Flow
        updateElement(element.type, element.id, {
          position: { x: node.position.x, y: node.position.y }
        });
      }
    },
    [getAllElements, updateElement]
  );

  // Handle edge connection
  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));

      // Add to store
      const { source, target } = params;
      useStore.getState().addRelationship({
        from: source,
        to: target,
        description: '新关系',
        technology: '',
      });
    },
    [setEdges]
  );

  // Expose onConnect for E2E testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__CREATE_CONNECTION__ = onConnect;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.__CREATE_CONNECTION__;
      }
    };
  }, [onConnect]);

  // Handle node click
  const onNodeClick = useCallback(
    (event, node) => {
      try {
        const element = getAllElements().find((el) => el.id === node.id);
        if (element) {
          console.log('[BAC4] Node clicked:', element.type, element.id);
          setSelectedElement(element);
        } else {
          console.error('[BAC4] Element not found for node:', node.id);
          setSelectedElement(null);
        }
      } catch (error) {
        console.error('[BAC4] Error in onNodeClick:', error);
        setSelectedElement(null);
      }
    },
    [getAllElements, setSelectedElement]
  );

  // Handle node double-click: drill into it (system → container → component → code)
  const onNodeDoubleClick = useCallback(
    (event, node) => {
      drillInto(node.id);
    },
    [drillInto]
  );

  // Handle edge click
  const onEdgeClick = useCallback(
    (event, edge) => {
      const relationship = relationships.find((rel) => rel.id === edge.id);
      setSelectedEdge(relationship);
    },
    [relationships, setSelectedEdge]
  );

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedElement(null);
    setSelectedEdge(null);
  }, [setSelectedElement, setSelectedEdge]);

  // Handle drag over to allow drop
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop to create new element
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/c4-element-type');
      if (!type || !reactFlowInstance) return;

      // Convert screen position to flow position
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const def = getType(type);
      const element = {
        name: `新建${def ? def.label : type}`,
        description: '',
        technology: '',
        position,
      };

      useStore.getState().addElement(type, element);
    },
    [reactFlowInstance]
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      <WorkspaceNav />

      <div className="flex flex-1 overflow-hidden">
        {currentView === 'bounded-context' ? (
          <BoundedContextCanvasView />
        ) : (
          <>
        <Toolbar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            className="bg-gray-50"
          >
            <Background color="#cbd5e1" gap={16} />
            <Controls />
            <MiniMap
              nodeColor={(node) => getType(node.data.type)?.mini || '#94a3b8'}
            />
          </ReactFlow>
          </div>
          <FieldEditorPanel />
        </div>

        <PropertiesPanel />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
