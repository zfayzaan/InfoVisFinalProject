// doubleLineGraph.js
d3.csv("JaredTiktokTrends.csv").then(data => {
    // Parse data
    data.forEach(d => {
      d.POINTS = +d.POINTS;
      d['# TIK-TOKS'] = +d['# TIK-TOKS'];
    });
  
    const margin = { top: 80, right: 60, bottom: 50, left: 60 },
          width = 1000 - margin.left - margin.right,
          height = 600 - margin.top - margin.bottom;
  
    const svg = d3.select("#visualization-doubleLine")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    // X scale
    const x = d3.scalePoint()
      .domain(data.map(d => d.DATE))
      .range([0, width]);
  
    // Y scales
    const yLeft = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.POINTS)])
      .range([height, 0]);
  
    const yRight = d3.scaleLinear()
      .domain([0, 8])
      .range([height, 0]);
  
    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));
  
    svg.append("g")
      .call(d3.axisLeft(yLeft))
      .attr("class", "y-axis-left")
      .selectAll("path,line,text")
      .attr("stroke", "#69b3a2")
      .attr("fill", "#69b3a2");
  
    svg.append("g")
      .attr("transform", `translate(${width},0)`)
      .call(d3.axisRight(yRight))
      .attr("class", "y-axis-right")
      .selectAll("path,line,text")
      .attr("stroke", "#ff8c00")
      .attr("fill", "#ff8c00");
  
    // Line generators
    const linePoints = d3.line()
      .x(d => x(d.DATE))
      .y(d => yLeft(d.POINTS));
  
    const lineTiktoks = d3.line()
      .x(d => x(d.DATE))
      .y(d => yRight(d['# TIK-TOKS']));
  
    // Draw POINTS line
    const pointsLine = svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#69b3a2")
      .attr("stroke-width", 2)
      .attr("class", "line-points")
      .attr("d", linePoints);
  
    // Draw TIK-TOKS line
    const tiktoksLine = svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#ff8c00")
      .attr("stroke-width", 2)
      .attr("class", "line-tiktoks")
      .attr("d", lineTiktoks);
  
    // Add POINTS data points
    const pointCircles = svg.selectAll("circle.point")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "point")
      .attr("cx", d => x(d.DATE))
      .attr("cy", d => yLeft(d.POINTS))
      .attr("r", 5)
      .attr("fill", "#69b3a2")
      .attr("stroke", "white")
      .attr("stroke-width", 1.5);
  
    // Add grey dotted lines (horizontal dashed lines)
    // Add grey dotted lines connecting the two y-axes
    // Add grey dotted horizontal lines connecting the two y-axes
    const yLeftTicks = yLeft.ticks(); // Get the tick values from the left y-axis

    svg.selectAll(".horizontal-dotted-line")
      .data(yLeftTicks)
      .enter()
      .append("line")
      .attr("class", "horizontal-dotted-line")
      .attr("x1", 0) // Start at the left edge of the chart (after margin)
      .attr("y1", d => yLeft(d)) // Y-position based on the left y-axis scale
      .attr("x2", width) // End at the right edge of the chart (before right margin)
      .attr("y2", d => yRight(d * (d3.max(data, dataPoint => dataPoint['# TIK-TOKS']) / d3.max(data, dataPoint => dataPoint.POINTS)))) // Corresponding Y-position on the right y-axis
      .attr("stroke", "grey")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,4")
      .attr("stroke-opacity", 0.5);
  
    // Tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("id", "tooltip")
      .style("position", "absolute")
      .style("background", "white")
      .style("padding", "8px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("display", "none");
  
    pointCircles
      .on("mouseover", function (event, d) {
        tooltip.style("display", "block")
          .html(`
            <strong>Date:</strong> ${d.DATE}<br/>
            <strong>Points:</strong> ${d.POINTS}<br/>
            <strong># Tik-Toks:</strong> ${d['# TIK-TOKS']}<br/>
            ${Object.keys(d).filter(k => !["DATE", "POINTS", "# TIK-TOKS"].includes(k)).map(k => `<strong>${k}:</strong> ${d[k]}`).join("<br/>")}
          `);
        d3.select(this).attr("r", 7);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function () {
        tooltip.style("display", "none");
        d3.select(this).attr("r", 5);
      });
  
    // Axis labels
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -45)
      .attr("x", -height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Points");
  
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", width + 45)
      .attr("x", -height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("# Tik-Toks");
  
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .style("text-anchor", "middle")
      .text("Date");
  
    // Legend with checkboxes
    const legend = svg.append("g")
      .attr("transform", "translate(0,-60)")
      .attr("id", "legend");
  
    legend.append("rect")
      .attr("width", 220)
      .attr("height", 60)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("rx", 10)
      .attr("ry", 10);
  
    // Points checkbox
    legend.append("foreignObject")
      .attr("x", 10)
      .attr("y", 10)
      .attr("width", 20)
      .attr("height", 20)
      .append("xhtml:input")
      .attr("type", "checkbox")
      .attr("id", "toggle-points")
      .attr("checked", true)
      .on("change", function () {
        const visible = this.checked;
        pointsLine.style("display", visible ? null : "none");
        pointCircles.style("display", visible ? null : "none");
      });
  
    legend.append("text")
      .attr("x", 40)
      .attr("y", 20)
      .text("Points")
      .style("font-size", "14px")
      .style("cursor", "pointer")
      .style("fill", "#69b3a2") // Match color of the "Points" line
      .on("click", function () {
        const checkbox = d3.select("#toggle-points").node();
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      });
  
    // TikToks checkbox
    legend.append("foreignObject")
      .attr("x", 120)
      .attr("y", 10)
      .attr("width", 20)
      .attr("height", 20)
      .append("xhtml:input")
      .attr("type", "checkbox")
      .attr("id", "toggle-tiktoks")
      .attr("checked", true)
      .on("change", function () {
        const visible = this.checked;
        tiktoksLine.style("display", visible ? null : "none");
      });
  
    legend.append("text")
      .attr("x", 150)
      .attr("y", 20)
      .text("# Tik-Toks")
      .style("font-size", "14px")
      .style("cursor", "pointer")
      .style("fill", "#ff8c00") // Match color of the "# Tik-Toks" line
      .on("click", function () {
        const checkbox = d3.select("#toggle-tiktoks").node();
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      });
  });
  