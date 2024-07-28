// Set up the SVG canvas dimensions
const margin = { top: 20, right: 20, bottom: 30, left: 40 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Function to create charts
function createChart(svgId, data, xAttr, yAttr, title) {
    const svg = d3.select(`#${svgId}`)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d[xAttr]))
        .range([0, width]);
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d[yAttr])])
        .range([height, 0]);

    // Axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));
    svg.append("g")
        .call(d3.axisLeft(y));

    // Labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom)
        .attr("text-anchor", "middle")
        .text("Engine Cylinders");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 10)
        .attr("text-anchor", "middle")
        .text(yAttr.replace('_', ' ').toUpperCase());

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text(title);

    // Circles
    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d[xAttr]))
        .attr("cy", d => y(d[yAttr]))
        .attr("r", 5)
        .style("fill", "steelblue");

    // Annotations
    const annotations = data.map(d => ({
        note: {
            label: `${d.make} (${d.engine_cylinders} cylinders)`,
            title: `${d[yAttr]} MPG`
        },
        x: x(d[xAttr]),
        y: y(d[yAttr]),
        dy: -10,
        dx: 10
    }));

    const makeAnnotations = d3.annotation()
        .annotations(annotations);

    svg.append("g")
        .call(makeAnnotations);
}

// Load data and create charts
d3.csv("./data/cars.csv").then(data => {
    data.forEach(d => {
        d.engine_cylinders = +d.engine_cylinders;
        d.average_highway_mpg = +d.average_highway_mpg;
        d.average_city_mpg = +d.average_city_mpg;
    });

    createChart("highway-chart", data, "engine_cylinders", "average_highway_mpg", "Effect of Engine Cylinders on Highway MPG");
    createChart("city-chart", data, "engine_cylinders", "average_city_mpg", "Effect of Engine Cylinders on City MPG");
    createChart("combined-chart", data, "engine_cylinders", "average_highway_mpg", "Combined View: Highway and City MPG");
});