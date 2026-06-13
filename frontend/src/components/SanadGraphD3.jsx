import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function SanadGraphD3({ hadith }) {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [physicsEnabled, setPhysicsEnabled] = useState(true);
    const [highlightedNodes, setHighlightedNodes] = useState(new Set());
    const [highlightedLinks, setHighlightedLinks] = useState(new Set());
    const simulationRef = useRef(null);

    const sanadList = hadith?.sanad || [];
    const sanadEdges = hadith?.sanad_edges || [];

    if (sanadList.length === 0) {
        return (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center text-slate-400">
                <i className="fa-solid fa-diagram-project mb-3 text-4xl opacity-20"></i>
                <h4 className="font-bold text-slate-700">Visualisasi Tidak Tersedia</h4>
                <p className="text-xs max-w-xs mx-auto mt-1">Hadis ini tidak memiliki data rantai perawi (sanad) untuk di-visualisasikan.</p>
            </div>
        );
    }

    // Parse nodes and edges for D3
    const rawNodes = sanadList.map((name, idx) => {
        // Classify narrators dynamically
        const isMukharrij = idx === 0;
        const isSahabat = idx === sanadList.length - 1 || idx === sanadList.length - 2;
        
        let type = 'Rawi Perantara';
        let colorClass = 'fill-indigo-500 stroke-indigo-200';
        let bgClass = 'bg-indigo-50 border-indigo-200 text-indigo-700';
        
        if (isMukharrij) {
            type = 'Mukharrij (Pencatat)';
            colorClass = 'fill-amber-500 stroke-amber-200';
            bgClass = 'bg-amber-50 border-amber-200 text-amber-700';
        } else if (isSahabat) {
            type = 'Sahabat Nabi';
            colorClass = 'fill-emerald-500 stroke-emerald-200';
            bgClass = 'bg-emerald-50 border-emerald-200 text-emerald-700';
        }

        return {
            id: name,
            name: name,
            type: type,
            order: idx + 1,
            colorClass,
            bgClass,
            isMukharrij,
            isSahabat
        };
    });

    const rawLinks = [];
    if (sanadEdges.length > 0) {
        sanadEdges.forEach(edge => {
            // Ensure source and target exist in nodes list
            const sourceExists = sanadList.includes(edge[0]);
            const targetExists = sanadList.includes(edge[1]);
            if (sourceExists && targetExists) {
                rawLinks.push({
                    source: edge[0],
                    target: edge[1]
                });
            }
        });
    } else {
        // Fallback to sequential transmission if edges are empty
        for (let i = 0; i < sanadList.length - 1; i++) {
            rawLinks.push({
                source: sanadList[i],
                target: sanadList[i + 1]
            });
        }
    }

    useEffect(() => {
        if (!svgRef.current || rawNodes.length === 0) return;

        const width = containerRef.current.clientWidth || 800;
        const height = 450;

        // Clear previous SVG content
        const svg = d3.select(svgRef.current)
            .attr('width', '100%')
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`);
            
        svg.selectAll('*').remove();

        // Create main group for zooming/panning
        const g = svg.append('g').attr('class', 'main-group');

        // Add Zoom Behavior
        const zoom = d3.zoom()
            .scaleExtent([0.3, 3])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoom);

        // Define Marker for Directed Arrows
        svg.append('defs').append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '-0 -5 10 10')
            .attr('refX', 24) // Offset so arrowhead rests on node boundary
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 7)
            .attr('markerHeight', 7)
            .attr('xoverflow', 'visible')
            .append('svg:path')
            .attr('d', 'M 0,-4 L 10 ,0 L 0,4')
            .attr('fill', '#94a3b8')
            .style('stroke', 'none');

        // Make deep copy of data for simulation
        const nodes = rawNodes.map(d => ({ ...d }));
        const links = rawLinks.map(d => ({ ...d }));

        // Create D3 Force Simulation
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(120))
            .force('charge', d3.forceManyBody().strength(-250))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collide', d3.forceCollide().radius(45));

        simulationRef.current = simulation;

        // Draw Links (Edges)
        const link = g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(links)
            .enter().append('line')
            .attr('stroke', '#cbd5e1')
            .attr('stroke-width', 2.5)
            .attr('marker-end', 'url(#arrowhead)')
            .attr('class', 'transition-all duration-300');

        // Draw Nodes
        const node = g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(nodes)
            .enter().append('g')
            .attr('cursor', 'pointer')
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended)
            );

        // Add beautiful drop shadows/glow to nodes
        node.append('circle')
            .attr('r', 16)
            .attr('fill', '#ffffff')
            .attr('stroke', '#f1f5f9')
            .attr('stroke-width', 4)
            .attr('class', 'shadow-sm');

        // Add colored center circle
        node.append('circle')
            .attr('r', 11)
            .attr('class', d => `${d.colorClass} transition-all duration-300`);

        // Add narrator text labels (White background wrapper for readability)
        const labelGroup = node.append('g')
            .attr('transform', 'translate(0, 32)');

        // Background rect for text
        labelGroup.append('rect')
            .attr('x', d => -Math.min(100, d.name.length * 4.5))
            .attr('y', -10)
            .attr('width', d => Math.min(200, d.name.length * 9))
            .attr('height', 16)
            .attr('rx', 4)
            .attr('fill', '#ffffff')
            .attr('opacity', 0.85);

        // The text itself
        labelGroup.append('text')
            .attr('text-anchor', 'middle')
            .attr('font-size', '10px')
            .attr('font-weight', '700')
            .attr('fill', '#334155')
            .text(d => d.name)
            .attr('class', 'pointer-events-none select-none');

        // Interactive hover styling & path tracing
        node.on('mouseover', function (event, d) {
            // Find active connections
            const connectedNodeIds = new Set([d.id]);
            const activeLinks = new Set();

            links.forEach(l => {
                if (l.source.id === d.id) {
                    connectedNodeIds.add(l.target.id);
                    activeLinks.add(`${l.source.id}-${l.target.id}`);
                } else if (l.target.id === d.id) {
                    connectedNodeIds.add(l.source.id);
                    activeLinks.add(`${l.source.id}-${l.target.id}`);
                }
            });

            setHighlightedNodes(connectedNodeIds);
            setHighlightedLinks(activeLinks);

            // Apply opacity styles directly in D3
            node.style('opacity', n => connectedNodeIds.has(n.id) ? 1 : 0.15);
            link.style('opacity', l => activeLinks.has(`${l.source.id}-${l.target.id}`) ? 1 : 0.15)
                .attr('stroke', l => activeLinks.has(`${l.source.id}-${l.target.id}`) ? '#10b981' : '#cbd5e1');

            // Enlarging active node circle
            d3.select(this).select('circle:nth-child(2)')
                .transition().duration(200)
                .attr('r', 14)
                .style('filter', 'drop-shadow(0 4px 6px rgba(16, 185, 129, 0.4))');
        })
        .on('mouseout', function () {
            setHighlightedNodes(new Set());
            setHighlightedLinks(new Set());

            // Reset opacities
            node.style('opacity', 1);
            link.style('opacity', 1)
                .attr('stroke', '#cbd5e1');

            d3.select(this).select('circle:nth-child(2)')
                .transition().duration(200)
                .attr('r', 11)
                .style('filter', 'none');
        })
        .on('click', function (event, d) {
            setSelectedNode(d);
        });

        // Tick function to update layout positions
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('transform', d => `translate(${d.x}, ${d.y})`);
        });

        // Drag simulation event handlers
        function dragstarted(event, d) {
            if (!event.active && physicsEnabled) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active && physicsEnabled) simulation.alphaTarget(0);
            if (physicsEnabled) {
                d.fx = null;
                d.fy = null;
            }
        }

        // Center visual zoom to fit nodes initially
        setTimeout(() => {
            const nodesBounds = g.node().getBBox();
            if (nodesBounds.width > 0 && nodesBounds.height > 0) {
                const dx = nodesBounds.width;
                const dy = nodesBounds.height;
                const x = nodesBounds.x + dx / 2;
                const y = nodesBounds.y + dy / 2;
                const scale = Math.max(0.4, Math.min(1.2, 0.9 / Math.max(dx / width, dy / height)));
                const translate = [width / 2 - scale * x, height / 2 - scale * y];

                svg.transition()
                    .duration(800)
                    .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
            }
        }, 150);

        return () => {
            simulation.stop();
        };
    }, [hadith, physicsEnabled]);

    // Highlight nodes matching search query
    useEffect(() => {
        if (!svgRef.current || rawNodes.length === 0) return;

        const term = searchTerm.trim().toLowerCase();
        const svg = d3.select(svgRef.current);
        const nodeSelection = svg.select('.nodes').selectAll('g');

        if (!term) {
            nodeSelection.style('opacity', 1);
            return;
        }

        nodeSelection.style('opacity', d => 
            d.name.toLowerCase().includes(term) ? 1 : 0.15
        );
    }, [searchTerm]);

    // Action handlers for zoom and controls
    const handleResetZoom = () => {
        const svg = d3.select(svgRef.current);
        const width = containerRef.current.clientWidth || 800;
        const height = 450;
        
        svg.transition()
            .duration(500)
            .call(
                d3.zoom().transform, 
                d3.zoomIdentity.translate(0, 0).scale(1)
            );
    };

    const togglePhysics = () => {
        setPhysicsEnabled(prev => !prev);
        if (simulationRef.current) {
            if (physicsEnabled) {
                simulationRef.current.stop();
            } else {
                simulationRef.current.alpha(0.3).restart();
            }
        }
    };

    return (
        <div className="space-y-6 w-full animate-in fade-in duration-300">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                {/* Search field */}
                <div className="relative w-full sm:w-72">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <i className="fa-solid fa-search text-sm"></i>
                    </span>
                    <input
                        type="text"
                        placeholder="Cari nama perawi..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-500 bg-white outline-none transition-all shadow-inner-sm"
                    />
                </div>

                {/* Toolbar Buttons */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={togglePhysics}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                            physicsEnabled
                                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                : 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm'
                        }`}
                        title={physicsEnabled ? 'Kunci posisi perawi' : 'Aktifkan tarikan gravitasi'}
                    >
                        <i className={`fa-solid ${physicsEnabled ? 'fa-anchor' : 'fa-play'}`}></i>
                        {physicsEnabled ? 'Bekukan Fisika' : 'Aktifkan Fisika'}
                    </button>

                    <button
                        onClick={handleResetZoom}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
                    >
                        <i className="fa-solid fa-arrows-to-eye"></i> Reset Zoom
                    </button>
                </div>
            </div>

            {/* Main Visualizer Panel */}
            <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                {/* D3 Canvas container */}
                <div className="lg:col-span-2 relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-inner flex flex-col justify-between h-[450px]">
                    {/* SVG Element */}
                    <svg ref={svgRef} className="w-full h-full block z-10" />

                    {/* Dynamic Overlay Help Text */}
                    <div className="absolute left-4 top-4 z-20 pointer-events-none bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800/80 shadow-md">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Interaksi Graf</p>
                        <p className="text-xs text-slate-200 mt-1 font-medium">Klik perawi untuk profil &bull; Geser/Zoom untuk eksplorasi</p>
                    </div>

                    {/* Bottom Legend */}
                    <div className="absolute right-4 bottom-4 z-20 flex items-center gap-4 bg-slate-950/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-800/80 shadow-md flex-wrap">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-glow shadow-emerald-500/20"></span>
                            <span className="text-[11px] font-bold text-slate-300">Sahabat Nabi</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-glow shadow-indigo-500/20"></span>
                            <span className="text-[11px] font-bold text-slate-300">Rawi Perantara</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-glow shadow-amber-500/20"></span>
                            <span className="text-[11px] font-bold text-slate-300">Mukharrij</span>
                        </div>
                    </div>
                </div>

                {/* Details Sidebar Card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[450px]">
                    {selectedNode ? (
                        <div className="space-y-6 flex-1 flex flex-col justify-between overflow-y-auto">
                            <div className="space-y-4">
                                <div className="flex items-start justify-between gap-2">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${selectedNode.bgClass}`}>
                                        {selectedNode.type}
                                    </span>
                                    <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                        Urutan #{selectedNode.order}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <h4 className="text-xl font-bold text-slate-900 leading-tight">
                                        {selectedNode.name}
                                    </h4>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Profil Perawi</p>
                                </div>

                                <div className="w-full h-px bg-slate-100"></div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Status Kredibilitas</p>
                                        <p className="text-sm font-semibold text-slate-700">
                                            {selectedNode.isSahabat ? 'Adil (Seluruh Sahabat Dinilai Adil)' : 'Tsiqah (Sangat Terpercaya)'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Klasifikasi Thabaqat</p>
                                        <p className="text-sm font-semibold text-slate-700">
                                            {selectedNode.isSahabat ? 'Sahabat Nabi' : selectedNode.isMukharrij ? 'Imam Mukharrij (Kitab Induk)' : 'Tabi\'in / Perawi Hadis'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedNode(null)}
                                className="w-full mt-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-600 py-2.5 rounded-xl text-xs font-bold transition-all"
                            >
                                Tutup Profil
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center h-full text-slate-400 space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 text-slate-300 flex items-center justify-center text-2xl shadow-inner">
                                <i className="fa-solid fa-address-card"></i>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-700 mb-1">Detail Profil Perawi</h4>
                                <p className="text-xs leading-relaxed max-w-xs">
                                    Klik salah satu titik lingkaran perawi di dalam grafik jaringan untuk memuat profil lengkapnya.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
