document.addEventListener('DOMContentLoaded', function() {
  console.log('totalPoints.js loaded successfully');
  
  const visualizationContainer = d3.select('#visualization-totalPoints')
    .classed('full-width-viz', true)
    .style('width', '100%')
    .style('overflow-x', 'auto'); 
  
  d3.csv("Jared McCain dataset - RookieYears.csv").then(function(data) {
    data.forEach(d => {
      d["Total points"] = +d["Total points"];
      d["Games Played"] = +d["Games Played"];
      d.originalX = d["Total points"];
    });
    
    createBasketballVisualization(data);
  }).catch(error => {
    console.error("Error loading CSV:", error);
    visualizationContainer.html(`
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-triangle me-2"></i>
        Error loading data. Please check the console for details.
      </div>
    `);
  });
  
  function createBasketballVisualization(data) {
    const containerWidth = visualizationContainer.node().getBoundingClientRect().width;
    const minWidth = 1000; 
    const vizWidth = Math.max(containerWidth, minWidth);
    
    const vizCard = visualizationContainer.append('div')
      .attr('class', 'card shadow p-3 mb-5 bg-white rounded fade-in')
      .style('min-width', vizWidth + 'px');
    
    const titleSection = vizCard.append('div')
      .attr('class', 'd-flex justify-content-between align-items-center mb-4');
      
    titleSection.append('h3')
      .attr('class', 'card-title m-0')
      .html('<i class="fas fa-basketball-ball me-2"></i>NBA Rookies - Total Points in Rookie Season');
    
    const controlsSection = titleSection.append('div')
      .attr('class', 'controls');
    
    const resetBtn = controlsSection.append('button')
      .attr('class', 'btn btn-outline-primary btn-sm reset-btn')
      .html('<i class="fas fa-undo me-1"></i>Reset Positions')
      .style('display', 'none'); 
      
    const modeToggle = controlsSection.append('div')
      .attr('class', 'form-check form-switch ms-2 d-inline-block');
      
    modeToggle.append('input')
      .attr('class', 'form-check-input')
      .attr('type', 'checkbox')
      .attr('id', 'dragModeToggle');
      
    modeToggle.append('label')
      .attr('class', 'form-check-label ms-1')
      .attr('for', 'dragModeToggle')
      .text('Comparison Mode');
    
    const instructionText = controlsSection.append('span')
      .attr('class', 'ms-2 text-muted drag-instructions')
      .text('Drag basketballs to compare players')
      .style('display', 'none');
    
    const chartContainer = vizCard.append('div')
      .attr('class', 'chart-container');
    
    data.sort((a, b) => a["Total points"] - b["Total points"]);
    
    const margin = { top: 100, right: 120, bottom: 100, left: 100 };
    const width = vizWidth - margin.left - margin.right;
    const height = 700 - margin.top - margin.bottom;
    
    const svg = chartContainer.append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d["Total points"]) * 1.05])
      .range([0, width]);
    
    const sizeScale = d3.scaleSqrt()
      .domain([0, d3.max(data, d => d["Total points"])])
      .range([25, 45]);
    
    svg.append('g')
      .attr('class', 'axis axis-x')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(10))
      .append('text')
      .attr('class', 'axis-title')
      .attr('x', width / 2)
      .attr('y', 40)
      .attr('fill', '#002B5C')
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Total Points Scored in Rookie Season');
    
    svg.append('g')
      .attr('class', 'grid-lines')
      .selectAll('line')
      .data(xScale.ticks(10))
      .enter()
      .append('line')
      .attr('x1', d => xScale(d))
      .attr('y1', -40)
      .attr('x2', d => xScale(d))
      .attr('y2', height)
      .attr('stroke', '#e0e0e0')
      .attr('stroke-dasharray', '3,3');
    
    const rowAssignment = [];
    for (let i = 0; i < data.length; i++) {
      let row = i % 4;
      
      if (i > 0) {
        const prevPts = data[i-1]["Total points"];
        const currPts = data[i]["Total points"];
        const pixelDist = Math.abs(xScale(prevPts) - xScale(currPts));
        
        if (pixelDist < 150) {
          const prevRow = rowAssignment[i-1];
          row = (prevRow + 1) % 4;
        }
      }
      
      rowAssignment.push(row);
      data[i].row = row;
    }
    
    const basketballsLayer = svg.append('g').attr('class', 'basketballs-layer');
    
    const comparisonArea = svg.append('g')
      .attr('class', 'comparison-area')
      .attr('transform', `translate(${width / 2}, ${height * 0.1})`);
    
    const playerGroups = basketballsLayer.selectAll('.player-group')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'player-group')
      .attr('id', (d, i) => `player-${i}`)
      .attr('transform', (d, i) => {
        const yPos = (rowAssignment[i] + 1) * (height / 5);
        d.x = xScale(d["Total points"]); 
        d.y = yPos; 
        return `translate(${d.x}, ${d.y})`;
      });
    
    function drawBasketball(selection, size) {
      const ballColor = '#e86100';
      
      selection.append('circle')
        .attr('r', size)
        .attr('fill', ballColor)
        .attr('stroke', '#000')
        .attr('stroke-width', 1)
        .attr('class', 'basketball-circle');
      
      selection.append('path')
        .attr('d', d => `M ${-size} 0 H ${size}`)
        .attr('stroke', '#000')
        .attr('stroke-width', 1.5)
        .attr('class', 'basketball-line');
      
      selection.append('path')
        .attr('d', d => `M 0 ${-size} V ${size}`)
        .attr('stroke', '#000')
        .attr('stroke-width', 1.5)
        .attr('class', 'basketball-line');
      
      selection.append('path')
        .attr('d', d => {
          const radius = size * 0.8;
          return `M ${-radius * 0.7} ${-radius * 0.7} Q 0 ${-radius * 0.1}, ${radius * 0.7} ${-radius * 0.7}`;
        })
        .attr('fill', 'none')
        .attr('stroke', '#000')
        .attr('stroke-width', 1.5)
        .attr('class', 'basketball-curve');
      
      selection.append('path')
        .attr('d', d => {
          const radius = size * 0.8;
          return `M ${-radius * 0.7} ${radius * 0.7} Q 0 ${radius * 0.1}, ${radius * 0.7} ${radius * 0.7}`;
        })
        .attr('fill', 'none')
        .attr('stroke', '#000')
        .attr('stroke-width', 1.5)
        .attr('class', 'basketball-curve');
    }
    
    const labelsLayer = svg.append('g')
      .attr('class', 'labels-layer');
      
    const tooltipContainer = d3.select('body').append('div')
      .attr('class', 'basketball-tooltip')
      .style('position', 'absolute')
      .style('display', 'none')
      .style('background-color', 'rgba(0, 43, 92, 0.9)')
      .style('color', 'white')
      .style('padding', '12px')
      .style('border-radius', '5px')
      .style('box-shadow', '0 4px 8px rgba(0,0,0,0.2)')
      .style('pointer-events', 'none')
      .style('z-index', 1000)
      .style('max-width', '250px')
      .style('font-size', '14px');
    
    const comparisonTooltip = d3.select('body').append('div')
      .attr('class', 'comparison-tooltip')
      .style('position', 'absolute')
      .style('display', 'none')
      .style('background-color', 'rgba(0, 43, 92, 0.95)')
      .style('color', 'white')
      .style('padding', '15px')
      .style('border-radius', '5px')
      .style('box-shadow', '0 8px 16px rgba(0,0,0,0.3)')
      .style('pointer-events', 'none')
      .style('z-index', 1000)
      .style('max-width', '350px')
      .style('font-size', '14px');
    
    const drag = d3.drag()
      .on('start', dragStarted)
      .on('drag', dragging)
      .on('end', dragEnded);
    
    playerGroups.each(function(d, i) {
      const group = d3.select(this);
      const size = sizeScale(d["Total points"]);
      
      const basketball = group.append('g')
        .attr('class', 'basketball')
        .attr('data-index', i)
        .attr('data-player', d["Player Name"])
        .style('cursor', 'pointer');
      
      drawBasketball(basketball, 0);
      
      basketball.selectAll('*').transition()
        .duration(1000)
        .attr('r', size)
        .attr('d', function() {
          const currentD = d3.select(this).attr('d');
          if (!currentD) return null;
          
          return currentD.replace(/[-\d.]+/g, match => {
            const num = parseFloat(match);
            return isNaN(num) ? match : (num / 0.1) * (size / 10);
          });
        });
      
      setTimeout(() => {
        basketball.selectAll('*').remove();
        drawBasketball(basketball, size);
        
        d.size = size;
      }, 1000);
      
      const row = rowAssignment[i];
      const isTopRow = row === 0 || row === 1;
      const labelGroup = labelsLayer.append('g')
        .attr('class', 'player-label')
        .attr('data-index', i)
        .attr('data-player', d["Player Name"])
        .attr('opacity', 0.9) 
        .attr('transform', () => {
          return `translate(${d.x}, ${d.y})`;
        });
        
      labelGroup.append('rect')
        .attr('class', 'name-bg')
        .attr('x', -80)
        .attr('y', isTopRow ? -size - 30 : size + 5)
        .attr('width', 160) 
        .attr('height', 20)
        .attr('fill', '#f8f9fa') 
        .attr('stroke', '#dee2e6') 
        .attr('stroke-width', 1)
        .attr('opacity', 0.9)
        .attr('rx', 4);
      
      labelGroup.append('text')
        .attr('class', 'player-name')
        .attr('y', isTopRow ? -size - 15 : size + 20)
        .attr('text-anchor', 'middle')
        .attr('fill', '#002B5C')
        .style('font-weight', 'bold')
        .style('font-size', '12px')
        .text(d["Player Name"]);
      
      labelGroup.append('rect')
        .attr('class', 'points-bg')
        .attr('x', -40)
        .attr('y', isTopRow ? -size - 50 : size + 25)
        .attr('width', 80) 
        .attr('height', 18)
        .attr('fill', '#ED174C')
        .attr('opacity', 0.8)
        .attr('rx', 4);
      
      labelGroup.append('text')
        .attr('class', 'points-counter')
        .attr('y', isTopRow ? -size - 36 : size + 39)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .style('font-weight', 'bold')
        .style('font-size', '12px')
        .text(d["Total points"] + " pts");
      
      basketball.on('mouseover', function(event) {
        const index = d3.select(this).attr('data-index');
        
        basketballsLayer.selectAll('.basketball').attr('opacity', 0.3);
        labelsLayer.selectAll('.player-label').attr('opacity', 0.3);
        
        d3.select(this).attr('opacity', 1);
        d3.select(`.player-label[data-index='${index}']`)
          .attr('opacity', 1)
          .raise();
        
        tooltipContainer.style('display', 'block')
          .html(`
            <strong>${d["Player Name"]}</strong><br>
            Season: ${d["Season Year"]}<br>
            Total Points: ${d["Total points"]}<br>
            Games Played: ${d["Games Played"]}<br>
            Points Per Game: ${(d["Total points"] / d["Games Played"]).toFixed(1)}
          `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
        
        d3.select(this).transition()
          .duration(200)
          .attr('transform', 'scale(1.1)');
      })
      .on('mouseout', function() {
        tooltipContainer.style('display', 'none');
        
        basketballsLayer.selectAll('.basketball').attr('opacity', 1);
        labelsLayer.selectAll('.player-label').attr('opacity', 0.9);
        
        d3.select(this).transition()
          .duration(200)
          .attr('transform', 'scale(1)');
      });
    });
    
    let draggedPlayers = []; 
    
    function dragStarted(event, d) {
      if (!d3.select('#dragModeToggle').property('checked')) return;
      
      d3.select(this).raise().classed('active', true);
      d3.select(`[data-player="${d["Player Name"]}"].player-label`).raise();
      
      resetBtn.style('display', 'inline-block');
    }
    
    function dragging(event, d) {
      if (!d3.select('#dragModeToggle').property('checked')) return;
      
      d.x = event.x;
      d.y = event.y;
      
      d3.select(this)
        .attr('transform', `translate(${d.x}, ${d.y})`);
      
      d3.select(`[data-player="${d["Player Name"]}"].player-label`)
        .attr('transform', `translate(${d.x}, ${d.y})`);
      
      if (!draggedPlayers.includes(d)) {
        draggedPlayers.push(d);
      }
      
      if (draggedPlayers.length >= 2) {
        updateComparison();
      }
    }
    
    function dragEnded(event, d) {
      if (!d3.select('#dragModeToggle').property('checked')) return;
      
      d3.select(this).classed('active', false);
      
      if (draggedPlayers.length >= 2) {
        updateComparison();
      }
    }
    
    function updateComparison() {
      if (draggedPlayers.length < 2) return;
      
      const svgRect = svg.node().getBoundingClientRect();
      const midX = svgRect.x + svgRect.width / 2;
      const topY = svgRect.y + 100; 
      
      let comparisonHTML = `<div class="comparison-header">Player Comparison</div><table class="comparison-table">`;
      
      comparisonHTML += `<tr><th></th>`;
      draggedPlayers.forEach(p => {
        comparisonHTML += `<th>${p["Player Name"]}</th>`;
      });
      comparisonHTML += `</tr>`;
      
      const statsToCompare = [
        {label: "Total Points", key: "Total points"},
        {label: "Games Played", key: "Games Played"},
        {label: "Points Per Game", calculate: p => (p["Total points"] / p["Games Played"]).toFixed(1)}
      ];
      
      statsToCompare.forEach(stat => {
        comparisonHTML += `<tr><td>${stat.label}</td>`;
        
        draggedPlayers.forEach(p => {
          let value = stat.calculate ? stat.calculate(p) : p[stat.key];
          comparisonHTML += `<td>${value}</td>`;
        });
        
        comparisonHTML += `</tr>`;
      });
      
      comparisonHTML += `</table>`;
      
      comparisonTooltip.style('display', 'block')
        .html(comparisonHTML)
        .style('left', `${midX}px`)
        .style('top', `${topY}px`);
    }
    
    d3.select('#dragModeToggle').on('change', function() {
      const isDragMode = d3.select(this).property('checked');
      
      if (isDragMode) {
        playerGroups.call(drag);
        instructionText.style('display', 'inline-block');
        
        basketballsLayer.selectAll('.basketball')
          .style('cursor', 'grab')
          .append('title').text('Drag to compare');
          
      } else {
        playerGroups.on('.drag', null);
        instructionText.style('display', 'none');
        
        comparisonTooltip.style('display', 'none');
        
        resetPositions();
      }
    });
    
    resetBtn.on('click', resetPositions);
    
    function resetPositions() {
      draggedPlayers = [];
      
      comparisonTooltip.style('display', 'none');
      
      playerGroups.transition()
        .duration(500)
        .attr('transform', (d, i) => {
          d.x = xScale(d.originalX);
          d.y = (data[i].row + 1) * (height / 5);
          return `translate(${d.x}, ${d.y})`;
        });
      
      labelsLayer.selectAll('.player-label')
        .transition()
        .duration(500)
        .attr('transform', function(d, i) {
          const player = data.find(p => p["Player Name"] === d3.select(this).attr('data-player'));
          return `translate(${player.x}, ${player.y})`;
        });
      
      resetBtn.style('display', 'none');
    }
    
    //legend stuff
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 200}, -50)`);
    
    legend.append('rect')
      .attr('x', -10)
      .attr('y', -20)
      .attr('width', 190)
      .attr('height', 50)
      .attr('fill', 'white')
      .attr('opacity', 0.7)
      .attr('rx', 5);
    
    legend.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .style('font-weight', 'bold')
      .style('font-size', '14px')
      .text('Basketball size represents');
    
    legend.append('text')
      .attr('x', 0)
      .attr('y', 20)
      .style('font-weight', 'bold')
      .style('font-size', '14px')
      .text('total points scored');
    
    const mccainData = data.find(d => d["Player Name"] === "Jared McCain");
    if (mccainData) {
      const x = xScale(mccainData["Total points"]);
      const idx = data.findIndex(d => d["Player Name"] === "Jared McCain");
      const row = rowAssignment[idx];
      const y = (row + 1) * (height / 5);
      
      svg.append('path')
        .attr('d', `M ${x + 70} ${y - 70} L ${x + 20} ${y - 20}`)
        .attr('stroke', '#ED174C')
        .attr('stroke-width', 2)
        .attr('fill', 'none')
        .attr('marker-end', 'url(#arrow)');
      
      svg.append('rect')
        .attr('x', x + 65)
        .attr('y', y - 90)
        .attr('width', 150)
        .attr('height', 40)
        .attr('fill', 'white')
        .attr('opacity', 0.8)
        .attr('rx', 5);
      
      svg.append('text')
        .attr('x', x + 75)
        .attr('y', y - 70)
        .attr('text-anchor', 'start')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#ED174C')
        .text('Rookie season cut short');
      
      svg.append('text')
        .attr('x', x + 75)
        .attr('y', y - 55)
        .attr('text-anchor', 'start')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#ED174C')
        .text('due to knee injury');
      
      svg.append('defs').append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 5)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#ED174C');
    }
    
    svg.append('rect')
      .attr('x', 10)
      .attr('y', -60)
      .attr('width', 320)
      .attr('height', 30)
      .attr('fill', 'white')
      .attr('opacity', 0.7)
      .attr('rx', 5);
    
    svg.append('text')
      .attr('x', 20)
      .attr('y', -40)
      .style('font-size', '14px')
      .style('fill', '#555')
      .text('Basketballs show rookie point totals - larger ball = more points');
    
    window.addEventListener('resize', function() {
      const newContainerWidth = visualizationContainer.node().getBoundingClientRect().width;
      if (Math.abs(newContainerWidth - containerWidth) > 100) {
        visualizationContainer.selectAll("*").remove();
        createBasketballVisualization(data);
      }
    });
  }
});