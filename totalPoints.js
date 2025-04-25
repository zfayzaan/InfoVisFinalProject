document.addEventListener('DOMContentLoaded', function() {
    console.log('totalPoints.js loaded successfully');
    
    const visualizationContainer = d3.select('#visualization-totalPoints')
      .classed('full-width-viz', true)
      .style('width', '100%')
      .style('overflow-x', 'auto'); // Add horizontal scrolling if needed
    
    // Load CSV data
    d3.csv("Jared McCain dataset - RookieYears.csv").then(function(data) {
      data.forEach(d => {
        d["Total points"] = +d["Total points"];
        d["Games Played"] = +d["Games Played"];
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
      const vizCard = visualizationContainer.append('div')
        .attr('class', 'card shadow p-3 mb-5 bg-white rounded fade-in')
        .style('min-width', '1200px'); 
      
      vizCard.append('h3')
        .attr('class', 'card-title text-center mb-4')
        .html('<i class="fas fa-basketball-ball me-2"></i>NBA Rookies - Total Points in Rookie Season');
      
      const chartContainer = vizCard.append('div')
        .attr('class', 'chart-container');
      
      data.sort((a, b) => a["Total points"] - b["Total points"]);
      //stupid thing kept getting cut off, hope this fixes it
      const margin = { top: 100, right: 100, bottom: 100, left: 100 };
      const width = 1500 - margin.left - margin.right; // Fixed width to ensure all shit shows or whateva
      const height = 700 - margin.top - margin.bottom; 
      
      const svg = chartContainer.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
      
      // scale for points
      const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d["Total points"]) * 1.05])
        .range([0, width]);
      
      // scale for size
      const sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d["Total points"])])
        .range([25, 45]);
      
      // axis
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
      
      // grid lines
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
      

    //changes for the text going over each other
      const rowAssignment = [];
      for (let i = 0; i < data.length; i++) {
        // Use 4 rows (0, 1, 2, 3)
        let row = i % 4;
        
        // if points are very close to previous player, force different row
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
      }
      
      const playerGroups = svg.selectAll('.player-group')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'player-group')
        .attr('transform', (d, i) => {
          const yPos = (rowAssignment[i] + 1) * (height / 5);
          return `translate(${xScale(d["Total points"])}, ${yPos})`;
        });
      
      // basketball svg stuff
      function drawBasketball(selection, size) {
        const ballColor = '#e86100';
        
        selection.append('circle')
          .attr('r', size)
          .attr('fill', ballColor)
          .attr('stroke', '#000')
          .attr('stroke-width', 1);
        
        // horiztonal line in middle
        selection.append('path')
          .attr('d', d => {
            return `M ${-size} 0 H ${size}`;
          })
          .attr('stroke', '#000')
          .attr('stroke-width', 1.5);
        
        // vertical line
        selection.append('path')
          .attr('d', d => {
            return `M 0 ${-size} V ${size}`;
          })
          .attr('stroke', '#000')
          .attr('stroke-width', 1.5);
        
        // the curved lines
        selection.append('path')
          .attr('d', d => {
            const radius = size * 0.8;
            return `M ${-radius * 0.7} ${-radius * 0.7} Q 0 ${-radius * 0.1}, ${radius * 0.7} ${-radius * 0.7}`;
          })
          .attr('fill', 'none')
          .attr('stroke', '#000')
          .attr('stroke-width', 1.5);
        
        selection.append('path')
          .attr('d', d => {
            const radius = size * 0.8;
            return `M ${-radius * 0.7} ${radius * 0.7} Q 0 ${radius * 0.1}, ${radius * 0.7} ${radius * 0.7}`;
          })
          .attr('fill', 'none')
          .attr('stroke', '#000')
          .attr('stroke-width', 1.5);
      }
      
      const labelsLayer = svg.append('g')
        .attr('class', 'labels-layer');
        
      // tool tip shit for hover
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
      
      // animation for extra flabvor
      playerGroups.each(function(d, i) {
        const group = d3.select(this);
        const size = sizeScale(d["Total points"]);
        
        // start with size 0 so it looks like ball is expanding 
        const basketball = group.append('g')
          .attr('class', 'basketball')
          .attr('data-index', i)
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
        }, 1000);
        
        // labels thing
        const row = rowAssignment[i];
        const isTopRow = row === 0 || row === 1;
        const labelGroup = labelsLayer.append('g')
          .attr('class', 'player-label')
          .attr('data-index', i)
          .attr('opacity', 0.9) 
          .attr('transform', () => {
            const x = xScale(d["Total points"]);
            const y = (row + 1) * (height / 5);
            return `translate(${x}, ${y})`;
          });
        //background for hovering so text doesn't collide
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
          
          // bring the label to the front cuz of the text was colliding
          labelsLayer.selectAll('.player-label').attr('opacity', 0.3); 
          
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
          
          labelsLayer.selectAll('.player-label').attr('opacity', 0.9);
          
          d3.select(this).transition()
            .duration(200)
            .attr('transform', 'scale(1)');
        });
      });
      
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
        const isAbove = row === 0 || row === 1;
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
    }
  });