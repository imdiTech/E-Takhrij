// Tunggu hingga DOM selesai dimuat
document.addEventListener("DOMContentLoaded", function () {
    // Memastikan data graph dari backend tersedia
    if (typeof sanadGraphData === 'undefined' || !sanadGraphData.nodes || sanadGraphData.nodes.length === 0) {
        document.getElementById('sanad-network').innerHTML = 
            '<div class="flex items-center justify-center h-full text-slate-400 text-sm italic">Data graf sanad tidak tersedia atau model NER belum siap.</div>';
        return;
    }

    // Persiapkan data nodes dan edges
    var nodes = new vis.DataSet(sanadGraphData.nodes);
    var edges = new vis.DataSet(sanadGraphData.edges);

    // Ambil container dari DOM
    var container = document.getElementById('sanad-network');

    // Sediakan data dalam format vis.js
    var data = {
        nodes: nodes,
        edges: edges
    };

    // Opsi konfigurasi visualisasi graf
    var options = {
        nodes: {
            shape: 'box',
            font: {
                face: 'Amiri, serif',
                size: 16,
                color: '#1e40af' // text-blue-800
            },
            color: {
                background: '#dbeafe', // bg-blue-100
                border: '#93c5fd',     // border-blue-300
                highlight: {
                    background: '#bfdbfe',
                    border: '#60a5fa'
                }
            },
            margin: 10,
            borderRadius: 8
        },
        edges: {
            arrows: {
                to: { enabled: true, scaleFactor: 0.8, type: 'arrow' }
            },
            color: {
                color: '#94a3b8', // text-slate-400
                highlight: '#64748b'
            },
            font: {
                size: 12,
                color: '#64748b',
                align: 'middle'
            },
            smooth: {
                type: 'cubicBezier',
                forceDirection: 'vertical',
                roundness: 0.4
            }
        },
        layout: {
            hierarchical: {
                direction: 'UD', // Up-Down
                sortMethod: 'directed',
                nodeSpacing: 150,
                levelSeparation: 100
            }
        },
        physics: {
            enabled: false // Matikan fisika karena kita pakai layout hierarki statis
        },
        interaction: {
            dragNodes: true,
            dragView: true,
            zoomView: true,
            hover: true
        }
    };

    // Inisialisasi network graf
    var network = new vis.Network(container, data, options);
});
