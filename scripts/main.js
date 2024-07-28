// Set up the SVG canvas dimensions
const margin = { top: 40, right: 350, bottom: 50, left: 60 }; // Increased right margin for legend
const width = 1000 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// Function to generate a custom color palette
function generateColors(numColors) {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
        colors.push(d3.interpolateRainbow(i / numColors));
    }
    return colors;
}

// Function to create the scatterplot with tooltips, annotations, and highlighting
function createScatterplot(data, highlightCylinders, annotationText) {
    d3.select("#chart").select("svg").remove(); // Remove the previous chart

    // Filter the data based on the highlightCylinders range
    const filteredData = data.filter(d => highlightCylinders.includes(d.EngineCylinders));

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleLinear()
        .domain([-1, 13])
        .range([0, width]);
    const y = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.AverageHighwayMPG) + 10])
        .range([height, 0]);

    // Color scale with custom colors
    const carMakes = Array.from(new Set(filteredData.map(d => d.Make)));
    const color = d3.scaleOrdinal()
        .domain(carMakes)
        .range(generateColors(carMakes.length));

    // Axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .ticks(7)
            .tickValues(d3.range(0, 14, 2))
        );
    svg.append("g")
        .call(d3.axisLeft(y).ticks(5));

    // Labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .text("Engine Cylinders");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("text-anchor", "middle")
        .text("Average Highway MPG");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Average Highway MPG vs. Engine Cylinders");

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Circles
    const circles = svg.selectAll("circle")
        .data(filteredData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.EngineCylinders))
        .attr("cy", d => y(d.AverageHighwayMPG))
        .attr("r", 5)
        .style("fill", d => color(d.Make))
        .style("opacity", 1)
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
                <strong>Make:</strong> ${d.Make}<br>
                <strong>Fuel Type:</strong> ${d.Fuel}<br>
                <strong>Average City MPG:</strong> ${d.AverageHighwayMPG}<br>
                <strong>Average Highway MPG:</strong> ${d.AverageCityMPG}
            `)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Annotations based on the current view
    let annotationX, annotationY, annotationDX, annotationDY;

    if (currentViewIndex === 0) {
        // Values for the first view
        annotationX = x(0) + 10;
        annotationY = y(d3.mean(filteredData, d => d.AverageHighwayMPG));
        annotationDX = 20;
        annotationDY = 20;
    } else if (currentViewIndex === 1) {
        // Values for the second view
        annotationX = x(4) + 10;
        annotationY = y(d3.mean(filteredData, d => d.AverageHighwayMPG));
        annotationDX = 20;
        annotationDY = -20;
    } else if (currentViewIndex === 2) {
        // Values for the third view
        annotationX = x(12) - 10;
        annotationY = y(d3.mean(filteredData, d => d.AverageHighwayMPG)) + 30;
        annotationDX = -20;
        annotationDY = -20;
    }

    const annotations = [
        {
            note: { label: annotationText },
            x: annotationX,
            y: annotationY,
            dy: annotationDY,
            dx: annotationDX
        }
    ];

    const makeAnnotations = d3.annotation()
        .annotations(annotations);

    const annotationGroup = svg.append("g")
        .call(makeAnnotations)
        .style("opacity", 0);

    annotationGroup.transition()
        .duration(1000)
        .style("opacity", 1);

    svg.selectAll(".annotation-note-label")
        .style("fill", "black")
        .style("font-weight", "bold");

    // Legend
    const legendWidth = 180;
    const legendHeight = 20;
    const itemsPerColumn = 22;

    const legend = svg.selectAll(".legend")
        .data(color.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => {
            const column = Math.floor(i / itemsPerColumn);
            const row = i % itemsPerColumn;
            return `translate(${width + 10 + column * legendWidth},${row * legendHeight})`;
        });

    legend.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color)
        .on("mouseover", function(event, d) {
            circles.style("opacity", 0.09);
            circles.filter(circleData => circleData.Make === d)
                .style("opacity", 1)
                .style("stroke", "black");
        })
        .on("mouseout", function() {
            circles.style("opacity", 1).style("stroke", "none");
        });

    legend.append("text")
        .attr("x", 20)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(d => d);
}

// Array of views with cylinder count ranges and annotations
const views = [
    { cylinders: [0], annotation: "All cars with 0 cylinders are electric in the data. Cars with 0 cylinders also have the highest average MPG on the highway." },
    { cylinders: [0, 1, 2, 3, 4, 5, 6], annotation: "Cars with greater than 0 cylinders are all gasoline. There is a steep and significant drop in average MPG on the highway. A large portion of vehicles in the data set also seem to have 4 engine cylinders." },
    { cylinders: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12], annotation: "As we reach 12 cylinders, we see the lowest average amount of MPG on the highway in these cars. It can also be said that these car manufacturers are usually stated to be more luxurious. The graph overall highlights an exponential drop in MPG on the highway as the number of engine cylinders increases linearly." }
];

let currentViewIndex = 0;

// Load data
d3.csv("./data/cars.csv").then(data => {
    data.forEach(d => {
        d.Make = d.Make;
        d.Fuel = d.Fuel;
        d.EngineCylinders = +d.EngineCylinders;
        d.AverageHighwayMPG = +d.AverageHighwayMPG;
        d.AverageCityMPG = +d.AverageCityMPG;
    });

    function updateView(index) {
        createScatterplot(data, views[index].cylinders, views[index].annotation);
    }

    // Set up event listener for homepage button
    document.getElementById("back-home").addEventListener("click", () => {
        window.location.href = 'index.html';
    });

    // Set up event listener for previous button
    document.getElementById("previous").addEventListener("click", () => {
        if (currentViewIndex > 0) {
            currentViewIndex--;
            updateView(currentViewIndex);
        }
    });

    // Set up event listener for next button
    document.getElementById("next").addEventListener("click", () => {
        if (currentViewIndex < views.length - 1) {
            currentViewIndex++;
            updateView(currentViewIndex);
        }
    });

    // Initial plot
    updateView(currentViewIndex);
});
