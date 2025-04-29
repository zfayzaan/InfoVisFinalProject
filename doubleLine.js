document.addEventListener('DOMContentLoaded', function() {
  console.log('doubleLine.js loaded successfully');
  
  const visualizationContainer = d3.select('#visualization-doubleLine')
    .classed('full-width-viz', true)
    .style('width', '100%')
    .style('overflow-x', 'auto');
  
  d3.csv("JaredTikTokTrends.csv").then(function(data) {
    data.forEach(d => {
      d.POINTS = +d.POINTS;
      d['# TIK-TOKS'] = +d['# TIK-TOKS'];
    });
    
    createDoubleLineVisualization(data);
  }).catch(error => {
    console.error("Error loading CSV:", error);
    visualizationContainer.html(`
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-triangle me-2"></i>
        Error loading data. Please check the console for details.
      </div>
    `);
  });
  
  function createDoubleLineVisualization(data) {
    const vizCard = visualizationContainer.append('div')
      .attr('class', 'card shadow p-3 mb-5 bg-white rounded fade-in')
      .style('min-width', '75rem')
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('align-items', 'center');
    
    vizCard.append('h3')
      .attr('class', 'card-title text-center mb-4')
      .html('<i class="fas fa-basketball-ball me-2"></i>Jared McCain: Game Points vs. TikTok Activity (# tiktoks posted a week before game date, including game date)');
    
    // subtitle for instructions
    vizCard.append('p')
      .attr('class', 'text-center mb-4 instruction-text')
      .html('<i class="fas fa-info-circle me-1"></i>Hover over the dotted diagonal line to see correlation information');
    
    const chartContainer = vizCard.append('div')
      .attr('class', 'chart-container')
      .style('display', 'flex')
      .style('justify-content', 'center');
    
    const margin = { top: 60, right: 80, bottom: 100, left: 60 },
          width = 1200 - margin.left - margin.right,
          height = 600 - margin.top - margin.bottom;
    
    const svg = chartContainer.append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .attr('overflow', 'visible')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const pointsColor = '#006BB6'; 
    const tiktokColor = '#ED174C'; //matching it to the other graphs
    
    const x = d3.scalePoint()
      .domain(data.map(d => d.DATE))
      .range([0, width]);
    
    const yLeft = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.POINTS) * 1.1])
      .range([height, 0]);
    
    const yRight = d3.scaleLinear()
      .domain([0, d3.max(data, d => d['# TIK-TOKS']) * 1.1])
      .range([height, 0]);
    
    svg.append('g')
      .attr('class', 'grid-lines')
      .selectAll('line')
      .data(yLeft.ticks(10))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('y1', d => yLeft(d))
      .attr('x2', width)
      .attr('y2', d => yLeft(d))
      .attr('stroke', '#e0e0e0')
      .attr('stroke-dasharray', '3,3');
    
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .style('font-size', '0.7rem');
    
    svg.append("g")
      .call(d3.axisLeft(yLeft))
      .attr("class", "axis axis-y-left")
      .selectAll("path,line")
      .attr("stroke", pointsColor);
    
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -45)
      .attr("x", -height / 2)
      .attr("fill", pointsColor)
      .attr("text-anchor", "middle")
      .style("font-size", "0.875rem")
      .text("Points");
    
    svg.append("g")
      .attr("transform", `translate(${width},0)`)
      .call(d3.axisRight(yRight))
      .attr("class", "axis axis-y-right")
      .selectAll("path,line")
      .attr("stroke", tiktokColor);
    
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", width + 45)
      .attr("x", -height / 2)
      .attr("fill", tiktokColor)
      .attr("text-anchor", "middle")
      .style("font-size", "0.875rem")
      .text("# TikToks");
    
    const linePoints = d3.line()
      .x(d => x(d.DATE))
      .y(d => yLeft(d.POINTS))
      .curve(d3.curveMonotoneX);
    
    
    const lineTiktoks = d3.line()
      .x(d => x(d.DATE))
      .y(d => yRight(d['# TIK-TOKS']))
      .curve(d3.curveMonotoneX);
    
    // points line
    const pointsLine = svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", pointsColor)
      .attr("stroke-width", 2)
      .attr("class", "line-points")
      .attr("d", linePoints);
    
    // tiktok line
    const tiktoksLine = svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", tiktokColor)
      .attr("stroke-width", 2)
      .attr("class", "line-tiktoks")
      .attr("d", lineTiktoks);
    
    const tooltip = d3.select('body').append('div')
      .attr('class', 'doubleline-tooltip')
      .style('position', 'absolute')
      .style('display', 'none')
      .style('background-color', 'rgba(0, 43, 92, 0.9)')
      .style('color', 'white')
      .style('padding', '0.75rem')
      .style('border-radius', '0.3125rem')
      .style('box-shadow', '0 0.25rem 0.5rem rgba(0, 0, 0, 0.2)')
      .style('pointer-events', 'none')
      .style('z-index', 1000)
      .style('font-size', '0.875rem');
    
    const correlationTooltip = d3.select('body').append('div')
      .attr('class', 'correlation-tooltip')
      .style('position', 'absolute')
      .style('display', 'none')
      .style('background-color', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '0.75rem')
      .style('border-radius', '0.3125rem')
      .style('box-shadow', '0 0.25rem 0.5rem rgba(0, 0, 0, 0.2)')
      .style('pointer-events', 'none')
      .style('z-index', 1000)
      .style('font-size', '0.875rem')
      .style('min-width', '200px')
      .style('text-align', 'center');
    
    // points data points, points of points?
    const pointCircles = svg.selectAll("circle.point")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "point")
      .attr("cx", d => x(d.DATE))
      .attr("cy", d => yLeft(d.POINTS))
      .attr("r", 6)
      .attr("fill", pointsColor)
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .on("mouseover", function(event, d) {
        tooltip.style("display", "block")
          .html(`
            <strong>${d.DATE}</strong><br/>
            <span style="color: ${pointsColor};">Points: ${d.POINTS}</span><br/>
            <span style="color: ${tiktokColor};">TikToks: ${d['# TIK-TOKS']}</span>
          `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 20) + 'px');
        
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 8)
          .attr("stroke-width", 2);
      })
      .on("mouseout", function() {
        tooltip.style("display", "none");
        
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 6)
          .attr("stroke-width", 1.5);
      });
    
    //tiktok points
    const tiktokCircles = svg.selectAll("circle.tiktok")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "tiktok")
      .attr("cx", d => x(d.DATE))
      .attr("cy", d => yRight(d['# TIK-TOKS']))
      .attr("r", 6)
      .attr("fill", tiktokColor)
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .on("mouseover", function(event, d) {
        tooltip.style("display", "block")
          .html(`
            <strong>${d.DATE}</strong><br/>
            <span style="color: ${pointsColor};">Points: ${d.POINTS}</span><br/>
            <span style="color: ${tiktokColor};">TikToks: ${d['# TIK-TOKS']}</span>
          `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 20) + 'px');
        
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 8)
          .attr("stroke-width", 2);
      })
      .on("mouseout", function() {
        tooltip.style("display", "none");
        
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 6)
          .attr("stroke-width", 1.5);
      });
    
    const correlation = calculateCorrelation(
      data.map(d => d.POINTS),
      data.map(d => d['# TIK-TOKS'])
    );
    
    //same if statements from the googleTrends vis
    let correlationDescription = "No clear relationship";
    let correlationColor = "#888888";
    
    if (correlation >= 0.5) {
      correlationDescription = "Strong positive relationship";
      correlationColor = "#28a745"; 
    } else if (correlation >= 0.3) {
      correlationDescription = "Moderate positive relationship";
      correlationColor = "#5cb85c"; 
    } else if (correlation >= 0.1) {
      correlationDescription = "Weak positive relationship";
      correlationColor = "#a3d7a3"; 
    } else if (correlation <= -0.5) {
      correlationDescription = "Strong negative relationship";
      correlationColor = "#dc3545"; 
    } else if (correlation <= -0.3) {
      correlationDescription = "Moderate negative relationship";
      correlationColor = "#f8a5ac"; 
    } else if (correlation <= -0.1) {
      correlationDescription = "Weak negative relationship";
      correlationColor = "#f8d7da"; 
    }
  
    const scaleForCorrelationLine = d3.scaleLinear()
      .domain([0, d3.max(data, d => d['# TIK-TOKS'])])
      .range([0, d3.max(data, d => d.POINTS)]);
    
    const correlationLineData = [
      { x: 0, y: height }, 
      { x: width, y: 0 }  
    ];
  
    const correlationLine = svg.append("path")
      .datum(correlationLineData)
      .attr("class", "correlation-line")
      .attr("fill", "none")
      .attr("stroke", correlationColor)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "5,5")
      .attr("d", d3.line()
        .x(d => d.x)
        .y(d => d.y)
      );
    
    //invisible line for hovering accesible, similar to how i did it in the google trends
    const correlationLineInteractive = svg.append("path")
      .datum(correlationLineData)
      .attr("class", "correlation-line-interactive")
      .attr("fill", "none")
      .attr("stroke", "transparent")
      .attr("stroke-width", 15) 
      .attr("d", d3.line()
        .x(d => d.x)
        .y(d => d.y)
      )
      .style("cursor", "pointer")
      .on("mouseover", function(event) {
        correlationLine
          .transition()
          .duration(200)
          .attr("stroke-width", 3)
          .attr("opacity", 1);
        
        correlationTooltip.style("display", "block")
          .html(`
            <div style="border-left: 4px solid ${correlationColor}; padding-left: 10px;">
              <strong>Correlation: ${correlation.toFixed(2)}</strong><br>
              ${correlation > 0 ? '<i class="fas fa-arrow-up" style="color:' + correlationColor + '"></i>' : 
                              correlation < 0 ? '<i class="fas fa-arrow-down" style="color:' + correlationColor + '"></i>' : 
                              '<i class="fas fa-arrows-alt-h"></i>'}
              ${correlationDescription}<br>
              ${correlation > 0 ? "Higher game points tend to come with more TikTok posts" : 
                              correlation < 0 ? "Higher game points tend to come with fewer TikTok posts" : 
                              "No relationship between game points and TikTok posts"}
            </div>
          `)
          .style("left", (event.pageX) + "px")
          .style("top", (event.pageY - 80) + "px");
      })
      .on("mouseout", function() {
        correlationLine
          .transition()
          .duration(200)
          .attr("stroke-width", 1.5)
          .attr("opacity", 0.7);
        
        
        correlationTooltip.style("display", "none");
      });
    
    // changed legend from the top to the bottom and matched colors with rest of site
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width / 2 - 150}, ${height + 70})`);
    
    
    legend.append("line")
      .attr("x1", -140)
      .attr("y1", 0)
      .attr("x2", -110)
      .attr("y2", 0)
      .attr("stroke", pointsColor)
      .attr("stroke-width", 2);
    
    legend.append("circle")
      .attr("cx", -125)
      .attr("cy", 0)
      .attr("r", 5)
      .attr("fill", pointsColor)
      .attr("stroke", "white")
      .attr("stroke-width", 1.5);
    
    legend.append("text")
      .attr("x", -100)
      .attr("y", 4)
      .text("Game Points")
      .style("font-size", "0.75rem");
    
    
    legend.append("line")
      .attr("x1", 40)
      .attr("y1", 0)
      .attr("x2", 70)
      .attr("y2", 0)
      .attr("stroke", tiktokColor)
      .attr("stroke-width", 2);
    
    legend.append("circle")
      .attr("cx", 55)
      .attr("cy", 0)
      .attr("r", 5)
      .attr("fill", tiktokColor)
      .attr("stroke", "white")
      .attr("stroke-width", 1.5);
    
    legend.append("text")
      .attr("x", 80)
      .attr("y", 4)
      .text("TikTok Posts")
      .style("font-size", "0.75rem");
    
    // correlation line legend
    legend.append("line")
      .attr("x1", 180)
      .attr("y1", 0)
      .attr("x2", 210)
      .attr("y2", 0)
      .attr("stroke", correlationColor)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "5,5");
    
    legend.append("text")
      .attr("x", 220)
      .attr("y", 4)
      .text("Correlation Line")
      .style("font-size", "0.75rem");
    
    // toggle buttons forfilter below
    const toggleContainer = vizCard.append('div')
      .attr('class', 'toggle-container mt-3 d-flex justify-content-center');
    
    const pointsBtn = toggleContainer.append('button')
      .attr('class', 'btn btn-sm btn-primary mx-2 toggle-points active')
      .html('<i class="fas fa-chart-line me-1"></i> Game Points')
      .style('background-color', pointsColor)
      .style('border-color', pointsColor)
      .on('click', function() {
        const isActive = d3.select(this).classed('active');
        
        if (isActive) {
          d3.select(this).classed('active', false)
            .style('background-color', 'white')
            .style('color', pointsColor);
          
          pointsLine.style('display', 'none');
          pointCircles.style('display', 'none');
        } else {
          d3.select(this).classed('active', true)
            .style('background-color', pointsColor)
            .style('color', 'white');
          
          pointsLine.style('display', null);
          pointCircles.style('display', null);
        }
      });
    
    const tiktoksBtn = toggleContainer.append('button')
      .attr('class', 'btn btn-sm btn-danger mx-2 toggle-tiktoks active')
      .html('<i class="fab fa-tiktok me-1"></i> TikTok Posts')
      .style('background-color', tiktokColor)
      .style('border-color', tiktokColor)
      .on('click', function() {
        const isActive = d3.select(this).classed('active');
        
        if (isActive) {
          d3.select(this).classed('active', false)
            .style('background-color', 'white')
            .style('color', tiktokColor);
          
          tiktoksLine.style('display', 'none');
          tiktokCircles.style('display', 'none');
        } else {
          d3.select(this).classed('active', true)
            .style('background-color', tiktokColor)
            .style('color', 'white');
          
          tiktoksLine.style('display', null);
          tiktokCircles.style('display', null);
        }
      });
  }
  
  function calculateCorrelation(x, y) {
    const n = x.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumX2 += x[i] * x[i];
      sumY2 += y[i] * y[i];
    }
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
});