document.addEventListener('DOMContentLoaded', function() {
    console.log('googleTrendsVis.js loaded successfully');
    
    const visualizationContainer = d3.select('#visualization-googleTrends')
      .classed('full-width-viz', true)
      .style('width', '100%')
      .style('overflow-x', 'auto');
    
    d3.csv("JaredMcCainGoogleTrends.csv").then(function(data) {
      data.forEach(d => {
        d["Interest Score"] = +d["Interest Score"];
        d["Week Average"] = +d["Week Average"];
        d["Game Points:"] = +d["Game Points:"];
        d.Date = new Date(d.Date);
      });
      
      const gameData = data.filter(d => !isNaN(d["Game Points:"]) && d["Game Points:"] > 0);
      
      createGoogleTrendsVisualization(data, gameData);
    }).catch(error => {
      // error handling blah
      console.error("Error loading CSV:", error);
      visualizationContainer.html(`
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Error loading data. Please check the console for details.
        </div>
      `);
    });
    
    function createGoogleTrendsVisualization(data, gameData) {
      const vizCard = visualizationContainer.append('div')
        .attr('class', 'card shadow p-3 mb-5 bg-white rounded fade-in')
        .style('min-width', '75rem')
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .style('align-items', 'center');
      
      vizCard.append('h3')
        .attr('class', 'card-title text-center mb-4')
        .html('<i class="fas fa-basketball-ball me-2"></i>Jared McCain: Google Search Interest (10/16-12/13) vs. Game Performance');
      
      const chartContainer = vizCard.append('div')
        .attr('class', 'chart-container')
        .style('display', 'flex')
        .style('justify-content', 'center');
      
      const margin = { top: 60, right: 80, bottom: 100, left: 60 };
      const width = 1200 - margin.left - margin.right;
      const height = 600 - margin.top - margin.bottom;
      
      const svg = chartContainer.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr('overflow', 'visible')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
      
      const dateExtent = d3.extent(data, d => d.Date);
      
      const xScale = d3.scaleTime()
        .domain(dateExtent)
        .range([0, width]);
      
      const yScaleInterest = d3.scaleLinear()
        .domain([0, d3.max(data, d => d["Interest Score"]) * 1.1])
        .range([height, 0]);
      
      const yScalePoints = d3.scaleLinear()
        .domain([0, d3.max(gameData, d => d["Game Points:"]) * 1.1])
        .range([height, 0]);
      
      const interestLine = d3.line()
        .x(d => xScale(d.Date))
        .y(d => yScaleInterest(d["Interest Score"]))
        .curve(d3.curveMonotoneX);
      
      svg.append('g')
        .attr('class', 'axis axis-x')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale)
          .ticks(d3.timeWeek.every(1))
          .tickFormat(d3.timeFormat("%b %d")))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .style('font-size', '0.7rem');
      
      svg.append('g')
        .attr('class', 'axis axis-y-interest')
        .call(d3.axisLeft(yScaleInterest))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -40)
        .attr('x', -height / 2)
        .attr('fill', '#002B5C')
        .attr('text-anchor', 'middle')
        .style('font-size', '0.875rem')
        .text('Google Interest Score');
      
      svg.append('g')
        .attr('class', 'axis axis-y-points')
        .attr('transform', `translate(${width}, 0)`)
        .call(d3.axisRight(yScalePoints))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 40)
        .attr('x', -height / 2)
        .attr('fill', '#ED174C')
        .attr('text-anchor', 'middle')
        .style('font-size', '0.875rem')
        .text('Points Scored');
      //grid lines
      svg.append('g')
        .attr('class', 'grid-lines')
        .selectAll('line')
        .data(yScaleInterest.ticks(10))
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('y1', d => yScaleInterest(d))
        .attr('x2', width)
        .attr('y2', d => yScaleInterest(d))
        .attr('stroke', '#e0e0e0')
        .attr('stroke-dasharray', '3,3');
      
      const tooltip = d3.select('body').append('div')
        .attr('class', 'google-trends-tooltip')
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
      
      svg.append('path')
        .datum(data)
        .attr('class', 'interest-line')
        .attr('fill', 'none')
        .attr('stroke', '#006BB6')
        .attr('stroke-width', 2)
        .attr('d', interestLine);
      
      const gameCircles = svg.selectAll('.game-circle')
        .data(gameData)
        .enter()
        .append('circle')
        .attr('class', 'game-circle')
        .attr('cx', d => xScale(d.Date))
        .attr('cy', d => yScalePoints(d["Game Points:"]))
        .attr('r', d => {
          // career high
          const highestPoints = d3.max(gameData, d => d["Game Points:"]);
          return d["Game Points:"] === highestPoints ? 8 : 6;
        })
        .attr('fill', '#ED174C')
        .attr('stroke', 'white')
        .attr('stroke-width', 1.5)
        .on('mouseover', function(event, d) {
          const dateFormat = d3.timeFormat("%B %d, %Y");
          const formattedDate = dateFormat(d.Date);
          
          const highestPoints = d3.max(gameData, d => d["Game Points:"]);
          const isCareerHigh = d["Game Points:"] === highestPoints;
          
          const highestInterest = d3.max(gameData, d => d["Interest Score"]);
          const isHighestInterest = d["Interest Score"] === highestInterest;
          
          let tooltipContent = `
            <strong>Game Date: ${formattedDate}</strong><br>
            Points Scored: ${d["Game Points:"]}${isCareerHigh ? ' (Career High)' : ''}<br>
            Google Interest: ${d["Interest Score"]}${isHighestInterest ? ' (Highest)' : ''}<br>
            Week Avg Interest: ${d["Week Average"].toFixed(1)}
          `;
          
          tooltip.style('display', 'block')
            .html(tooltipContent)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 20) + 'px');
          
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', d => {
              const highestPoints = d3.max(gameData, d => d["Game Points:"]);
              return d["Game Points:"] === highestPoints ? 10 : 8;
            })
            .attr('stroke-width', 2);
        })
        .on('mouseout', function(d) {
          tooltip.style('display', 'none');
          
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', d => {
              const highestPoints = d3.max(gameData, d => d["Game Points:"]);
              return d._current && d._current["Game Points:"] === highestPoints ? 8 : 6;
            })
            .attr('stroke-width', 1.5);
        });
      
      svg.append('path')
        .attr('class', 'reference-line')
        .attr('stroke', '#333')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '5,5')
        .attr('opacity', 0.5)
        .attr('fill', 'none')
        .attr('d', d3.line()([
          [0, height],
          [width, 0]
        ]));
      
      // Calculate correlation coefficient
      const correlation = calculateCorrelation(
        gameData.map(d => d["Interest Score"]), 
        gameData.map(d => d["Game Points:"])
      );
      
      // correlation description
      let correlationDescription = "No clear relationship";
      if (correlation >= 0.5) {
        correlationDescription = "Strong positive relationship";
      } else if (correlation >= 0.3) {
        correlationDescription = "Moderate positive relationship";
      } else if (correlation >= 0.1) {
        correlationDescription = "Weak positive relationship";
      } else if (correlation <= -0.5) {
        correlationDescription = "Strong negative relationship";
      } else if (correlation <= -0.3) {
        correlationDescription = "Moderate negative relationship";
      } else if (correlation <= -0.1) {
        correlationDescription = "Weak negative relationship";
      }
      
      svg.append('text')
        .attr('x', width - 300)
        .attr('y', 30)
        .attr('text-anchor', 'start')
        .style('font-size', '0.875rem')
        .style('font-weight', 'bold')
        .text(`Correlation: ${correlation.toFixed(2)}`);
      
      svg.append('text')
        .attr('x', width - 300)
        .attr('y', 50)
        .attr('text-anchor', 'start')
        .style('font-size', '0.8rem')
        .text(correlationDescription);
      
      // legend stuff
      const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width / 2 - 150}, ${height + 70})`);

      legend.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 30)
        .attr('y2', 0)
        .attr('stroke', '#006BB6')
        .attr('stroke-width', 2);
      
      legend.append('text')
        .attr('x', 40)
        .attr('y', 4)
        .text('Google Interest Score')
        .style('font-size', '0.8rem');
      
      legend.append('circle')
        .attr('cx', 200)
        .attr('cy', 0)
        .attr('r', 6)
        .attr('fill', '#ED174C')
        .attr('stroke', 'white')
        .attr('stroke-width', 1.5);
      
      legend.append('text')
        .attr('x', 215)
        .attr('y', 4)
        .text('Points Scored')
        .style('font-size', '0.8rem');
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