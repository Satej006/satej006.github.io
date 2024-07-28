// Set up the SVG canvas dimensions
const margin = { top: 20, right: 20, bottom: 30, left: 40 };
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Sample data
const data = [
    { x: 50, y: 100, label: "A" },
    { x: 150, y: 200, label: "B" },
    { x: 250, y: 300, label: "C" },
];

// Draw circles
svg.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 10)
    .style("fill", "steelblue");

// Set up annotations
const annotations = data.map(d => ({
    note: {
        label: d.label,
        title: `Point ${d.label}`
    },
    x: d.x,
    y: d.y,
    dy: -10,
    dx: 10
}));

const makeAnnotations = d3.annotation()
    .annotations(annotations);

svg.append("g")
    .call(makeAnnotations);