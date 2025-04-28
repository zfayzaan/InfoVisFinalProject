document.addEventListener('DOMContentLoaded', function() {
    console.log('fgVis.js loaded successfully');
    
    const visualizationContainer = d3.select('#visualization-fg')
      .classed('full-width-viz', true)
      .style('width', '100%')
      .style('overflow-x', 'auto');
    
    d3.csv("Jared McCain dataset - RookieYears.csv").then(function(data) {
      data.forEach(d => {
        d["Total points"] = +d["Total points"];
        d["Games Played"] = +d["Games Played"];
        d["FG %"] = parseFloat(d["FG %"]) / 100; 
        d["3FG %"] = parseFloat(d["3FG %"]) / 100; 
        
        d.year = parseInt(d["Season Year"].split("-")[0]);
      });
      
      createFGPercentageVisualization(data);
    }).catch(error => {
      console.error("Error loading CSV:", error);
      visualizationContainer.html(`
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Error loading data. Please check the console for details.
        </div>
      `);
    });
    
    function createFGPercentageVisualization(data) {
    //make sure that the non sixers players are last, since they are the last 6 rotys
      const lastSixPlayers = data.slice(-6);
      const otherPlayers = data.slice(0, data.length - 6);
      const sortedData = [...otherPlayers, ...lastSixPlayers];
      
      const vizCard = visualizationContainer.append('div')
        .attr('class', 'card shadow p-3 mb-5 bg-white rounded fade-in')
        .style('min-width', '75rem')
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .style('align-items', 'center'); 
      
      vizCard.append('h3')
        .attr('class', 'card-title text-center mb-4')
        .html('<i class="fas fa-basketball-ball me-2"></i>Rookie Year Stats for Sixers Roster + Last 6 ROTYs');
      
      const chartContainer = vizCard.append('div')
        .attr('class', 'chart-container')
        .style('display', 'flex')
        .style('justify-content', 'center'); 
      
      const margin = { top: 60, right: 50, bottom: 180, left: 60 }; 
      const width = Math.max(sortedData.length * 50, 1200) - margin.left - margin.right;
      const height = 600 - margin.top - margin.bottom;
      
      const svg = chartContainer.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr('overflow', 'visible') 
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
      
      const fgColor = '#006BB6'; 
      const threeFgColor = '#ED174C'; 
      
      const xScale = d3.scaleBand()
        .domain(sortedData.map(d => d["Player Name"]))
        .range([0, width])
        .padding(0.3); 
      
      const xSubgroup = d3.scaleBand()
        .domain(['FG %', '3FG %'])
        .range([0, xScale.bandwidth()])
        .padding(0.1);
      
      const yScale = d3.scaleLinear()
        .domain([0, 1])
        .range([height, 0]);
      
      svg.append('g')
        .attr('class', 'axis axis-x')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .style('font-size', '0.7rem');
      
      svg.append('g')
        .attr('class', 'axis axis-y')
        .call(d3.axisLeft(yScale).tickFormat(d3.format(".0%")));
      
      svg.append('g')
        .attr('class', 'grid-lines')
        .selectAll('line')
        .data(yScale.ticks(10))
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('y1', d => yScale(d))
        .attr('x2', width)
        .attr('y2', d => yScale(d))
        .attr('stroke', '#e0e0e0')
        .attr('stroke-dasharray', '3,3');
      
      const tooltip = d3.select('body').append('div')
        .attr('class', 'fg-percentage-tooltip')
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
      
      const playerGroups = svg.selectAll('.player-group')
        .data(sortedData)
        .enter()
        .append('g')
        .attr('class', 'player-group')
        .attr('transform', d => `translate(${xScale(d["Player Name"])}, 0)`);
      
      playerGroups.append('rect')
        .attr('class', 'fg-bar')
        .attr('x', d => xSubgroup('FG %'))
        .attr('y', d => yScale(d["FG %"]))
        .attr('width', xSubgroup.bandwidth())
        .attr('height', d => height - yScale(d["FG %"]))
        .attr('fill', fgColor) 
        .attr('rx', 2)
        .on('mouseover', function(event, d) {
          const ppg = (d["Total points"] / d["Games Played"]).toFixed(1);
          
          tooltip.style('display', 'block')
            .html(`
              <strong>${d["Player Name"]}</strong><br>
              Season: ${d["Season Year"]}<br>
              FG: ${(d["FG %"] * 100).toFixed(1)}%<br>
              PPG (Total points/Games played): ${ppg}
            `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 20) + 'px');
          
          d3.select(this)
            .transition()
            .duration(200)
            .attr('opacity', 0.8)
            .attr('stroke', '#333')
            .attr('stroke-width', 2);
        })
        .on('mouseout', function() {
          tooltip.style('display', 'none');
          
          d3.select(this)
            .transition()
            .duration(200)
            .attr('opacity', 1)
            .attr('stroke', 'none');
        });
      
      playerGroups.append('rect')
        .attr('class', '3fg-bar')
        .attr('x', d => xSubgroup('3FG %'))
        .attr('y', d => yScale(d["3FG %"]))
        .attr('width', xSubgroup.bandwidth())
        .attr('height', d => height - yScale(d["3FG %"]))
        .attr('fill', threeFgColor)
        .attr('rx', 2)
        .on('mouseover', function(event, d) {
          const ppg = (d["Total points"] / d["Games Played"]).toFixed(1);
          
          tooltip.style('display', 'block')
            .html(`
              <strong>${d["Player Name"]}</strong><br>
              Season: ${d["Season Year"]}<br>
              3FG: ${(d["3FG %"] * 100).toFixed(1)}%<br>
              PPG (Total Points/Games played): ${ppg} 
            `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 20) + 'px');
          
          d3.select(this)
            .transition()
            .duration(200)
            .attr('opacity', 0.8)
            .attr('stroke', '#333')
            .attr('stroke-width', 2);
        })
        .on('mouseout', function() {
          tooltip.style('display', 'none');
          
          d3.select(this)
            .transition()
            .duration(200)
            .attr('opacity', 1)
            .attr('stroke', 'none');
        });
    //this code here puts a rounded percentage above each bar, just commented it out since we show it with the hover event  
    //   playerGroups.append('text')
    //     .attr('x', d => xSubgroup('FG %') + xSubgroup.bandwidth() / 2)
    //     .attr('y', d => yScale(d["FG %"]) - 5)
    //     .attr('text-anchor', 'middle')
    //     .attr('fill', '#002B5C')
    //     .style('font-weight', 'bold')
    //     .style('font-size', '0.6rem')
    //     .text(d => `${(d["FG %"] * 100).toFixed(0)}%`);
      
    //   playerGroups.append('text')
    //     .attr('x', d => xSubgroup('3FG %') + xSubgroup.bandwidth() / 2)
    //     .attr('y', d => yScale(d["3FG %"]) - 5)
    //     .attr('text-anchor', 'middle')
    //     .attr('fill', '#002B5C')
    //     .style('font-weight', 'bold')
    //     .style('font-size', '0.6rem')
    //     .text(d => `${(d["3FG %"] * 100).toFixed(0)}%`);
      
      const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width / 2 - 100}, ${height + 120})`); 
      
      legend.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', fgColor);
      
      legend.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .text('FG%')
        .style('font-size', '0.75rem');
      
      legend.append('rect')
        .attr('x', 100)
        .attr('y', 0)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', threeFgColor);
      
      legend.append('text')
        .attr('x', 120)
        .attr('y', 12)
        .text('3FG%')
        .style('font-size', '0.75rem');
    }
  });