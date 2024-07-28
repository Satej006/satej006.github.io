// Set up the SVG canvas dimensions
const margin = { top: 40, right: 350, bottom: 50, left: 60 }; // Increased right margin for legend
const width = 1000 - margin.left - margin.right; // Increased width
const height = 600 - margin.top - margin.bottom; // Increased height

// Function to generate a custom color palette
function generateColors(numColors) {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
        colors.push(d3.interpolateRainbow(i / numColors));
    }
    return colors;
}

// Function to create the scatterplot with highlighting and annotations
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
        .domain([-1, 13]) // Fixed x-axis domain from -1 to 13
        .range([0, width]);
    const y = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d.AverageHighwayMPG) + 5])
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
            .ticks(7) // This determines the number of ticks displayed
            .tickValues(d3.range(0, 14, 2)) // Show every other value from -1 to 13
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
        .style("opacity", 1) // No need for opacity based on highlightCylinders now
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

    // Annotations with hardcoded values based on the view
    let annotationX, annotationY, annotationDX, annotationDY;

    if (currentViewIndex === 0) {
        // Values for the first view (0 cylinders)
        annotationX = x(0) + 10; // Example value, adjust as needed
        annotationY = y(d3.mean(filteredData, d => d.AverageHighwayMPG)); // Example value, adjust as needed
        annotationDX = 20; // Example value, adjust as needed
        annotationDY = 20; // Example value, adjust as needed
    } else if (currentViewIndex === 1) {
        // Values for the second view (0-6 cylinders)
        annotationX = x(4) + 10; // Example value, adjust as needed
        annotationY = y(d3.mean(filteredData, d => d.AverageHighwayMPG)); // Example value, adjust as needed
        annotationDX = 20; // Example value, adjust as needed
        annotationDY = -20; // Example value, adjust as needed
    } else if (currentViewIndex === 2) {
        // Values for the third view (0-12 cylinders)
        annotationX = x(12) - 10; // Example value, adjust as needed
        annotationY = y(d3.mean(filteredData, d => d.AverageHighwayMPG)) + 30; // Example value, adjust as needed
        annotationDX = -20; // Example value, adjust as needed
        annotationDY = -20; // Example value, adjust as needed
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
        .style("opacity", 0); // Set initial opacity to 0

    // Transition the annotations to full opacity
    annotationGroup.transition()
        .duration(1000)
        .style("opacity", 1);

    // Make annotation text black and bold
    svg.selectAll(".annotation-note-label")
        .style("fill", "black")
        .style("font-weight", "bold");

    // Legend
    const legendWidth = 180; // Width for legend items
    const legendHeight = 20; // Height for legend items
    const legendSpacing = 25; // Spacing between items
    const itemsPerColumn = 22; // Number of items per column

    const legend = svg.selectAll(".legend")
        .data(color.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => {
            const column = Math.floor(i / itemsPerColumn); // Determine column
            const row = i % itemsPerColumn; // Determine row within column
            return `translate(${width + 10 + column * legendWidth},${row * legendHeight})`;
        });

    legend.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color)
        .on("mouseover", function(event, d) {
            // Highlight the corresponding circles
            circles.style("opacity", 0.09); // Fade out all circles
            circles.filter(circleData => circleData.Make === d) // Highlight matching circles
                .style("opacity", 1)
                .style("stroke", "black");
        })
        .on("mouseout", function() {
            // Reset the circle opacity
            circles.style("opacity", 1).style("stroke", "none");
        });

    legend.append("text")
        .attr("x", 20)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(d => d);
}

// Array of views with cylinder count ranges
const views = [
    { cylinders: [0], annotation: "All cars with 0 cylinders are electric in the data. Cars with 0 cylinders also have the highest average MPG on the highway." },
    { cylinders: [0, 1, 2, 3, 4, 5, 6], annotation: "Cars with greater than 0 cylinders are all gasoline. There is a steep and significant drop in average MPG on the highway. A large portion of vehicles in the data set also seem to have 4 engine cylinders." },
    { cylinders: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12], annotation: "As we reach 12 cylinders, we see the lowest average amount of MPG on the highway in these cars. It can also be said that these car manufacturers are usually stated to be more luxurious. The graph overall highlights an exponential drop in MPG on the highway as the number of engine cylinders increases linearly." }
];

let currentViewIndex = 0;

// Load data and set up event listeners for buttons
d3.csv("./data/cars.csv").then(data => {
    data.forEach(d => {
        d.Make = d.Make;
        d.Fuel = d.Fuel;
        d.EngineCylinders = +d.EngineCylinders;
        d.AverageHighwayMPG = +d.AverageHighwayMPG;
        d.AverageCityMPG = +d.AverageCityMPG; // Make sure this field is included
    });

    function updateView(index) {
        createScatterplot(data, views[index].cylinders, views[index].annotation);
    }

    document.getElementById("back-home").addEventListener("click", () => {
        window.location.href = 'index.html'; // Redirect to the homepage
    });

    document.getElementById("previous").addEventListener("click", () => {
        if (currentViewIndex > 0) {
            currentViewIndex--;
            updateView(currentViewIndex);
        }
    });

    document.getElementById("next").addEventListener("click", () => {
        if (currentViewIndex < views.length - 1) {
            currentViewIndex++;
            updateView(currentViewIndex);
        }
    });

    // Initial plot
    updateView(currentViewIndex);
});
