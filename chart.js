function tempChart({ element, data }) {
    // Variable declarations
    let noScrollWidth, scrollWidth, delaunay, tooltipDatumIndex;
  
  
    // Chart dimensions and style constants
    const height = 235.24;
    const focusDotSize = 4;
    const lineStrokeWidth = 2;
    const dayDotSize = 2;
    const dayDotsOffset = 8;
    const dayLabelsHeight = 20;
    const dayLabelsOffset = dayDotsOffset * 2 + dayLabelsHeight / 2;
    const monthLabelsHeight = 24;
    const monthLabelsOffset =
      dayLabelsOffset + dayLabelsHeight / 2 + monthLabelsHeight / 2;
    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = monthLabelsOffset + monthLabelsHeight / 2;
    const marginLeft = focusDotSize;
    const thresholds = [400, 640];
  
    // Accessor functions for data
    const xAccessor = (d) => d.date;
    const y1Accessor = (d) =>
      Number.isFinite(d.maxMaxThisYear) ? d.maxMaxThisYear : undefined;
    const y2Accessor = (d) => (Number.isFinite(d.avgMax) ? d.avgMax : undefined);
  
    // Formatting values for tooltip
    const valueFormat = new Intl.NumberFormat('de-DE', {
      maximumFractionDigits: 1,
    }).format;
  
    // Process and organize data
    const { groupedData, flattenedData, pointsData } = processData(data);
    const totalDays = flattenedData.length;
  
    // Month names for labels
    const monthNames = [
      'Januar',
      'Februar',
      'März',
      'April',
      'Mai',
      'Juni',
      'Juli',
      'August',
      'September',
      'Oktober',
      'November',
      'Dezember',
    ];
  
    // Scales for the chart
    const x = d3.scaleUtc().domain(d3.extent(flattenedData, xAccessor));
    const y = d3
      .scaleLinear()
      .domain(getYExtent())
      .range([height - marginBottom, marginTop])
      .nice();
  
    // Calculate the extent for y-axis
    function getYExtent() {
      let yMin = d3.min(flattenedData, (d) =>
        d3.min([y1Accessor(d), y2Accessor(d)])
      );
      let yMax = d3.max(flattenedData, (d) =>
        d3.max([y1Accessor(d), y2Accessor(d)])
      );
      const padding = (yMax - yMin) * 0.1;
      yMin -= padding;
      yMax += padding;
      return [yMin, yMax];
    }
  
    // Area and line generators
    const areaGenerator = d3
      .area()
      .x((d) => x(d[0]))
      .y0(height - marginBottom)
      .y1((d) => y(d[1]))
      .curve(d3.curveMonotoneX)
      .defined((d) => d[1] !== undefined);
    const lineGenerator = areaGenerator.lineY1();
  
    // Create the main container
    const container = d3.select(element).attr('class', 'temp-chart');
    const chartContainer = container
      .append('div')
      .attr('class', 'chart-container');
    const scrollContainer = chartContainer
      .append('div')
      .attr('class', 'scroll-container')
      .on('scroll', mouseleft, { passive: true });
    const svg = scrollContainer
      .append('svg')
      .attr('class', 'main-svg')
      .on('mouseenter', mouseentered)
      .on('mousemove', mousemoved)
      .on('mouseleave', mouseleft);
    const yAxisSvg = chartContainer.append('svg').attr('class', 'y-axis-svg');
    const swatchesContainer = container
      .append('div')
      .attr('class', 'swatches-container');
  
    // Render color swatches
    //renderSwatches();
  
    // Tooltip element
    const tooltip = container.append('div').attr('class', 'tip');
  
    // Resize observer for responsive chart
    new ResizeObserver((entries) =>
      entries.forEach((entry) => {
        console.log(entry)
        resized(entry.contentRect);
      })
    ).observe(scrollContainer.node());
  
    // Resize handler
    function resized(rect) {
      noScrollWidth = rect.width;
      const boundedWidth =
      rect.width - marginRight - dayLabelsHeight / 2 + marginLeft;
    const months = d3.bisect(thresholds, boundedWidth) + 1;
    const days = d3.sum(groupedData.slice(-months), (d) => d.days.length);
      scrollWidth =  (boundedWidth / (days - 1)) * (totalDays - 1) + marginLeft + marginRight;
  
      x.range([marginLeft, scrollWidth - marginRight]);
  
      // Create Delaunay triangulation for interaction
      delaunay = d3.Delaunay.from(
        pointsData,
        (d) => x(d[0]),
        (d) => y(d[1])
      );
  
      // Set dimensions for y-axis and main SVG
      yAxisSvg.attr('width', noScrollWidth).attr('height', height);
  
      svg.attr('width', scrollWidth).attr('height', height);
  
      // Render the chart
      renderChart();
  
      scrollContainer.node().scrollLeft = scrollContainer.node().scrollWidth;
    }
  
    // Main render function
    function renderChart() {
      renderYAxis();
      renderSeries();
      renderXAxis();
      renderFocus();
      renderTooltip();
    }
  
    // Render y-axis grid
    function renderYAxis() {
      const g = yAxisSvg
        .selectAll('.y-axis-g')
        .data([0])
        .join((enter) => enter.append('g').attr('class', 'y-axis-g'))
        .attr('transform', `translate(${noScrollWidth - marginRight},0)`);
  
      g.selectAll('.bg-rect')
        .data([0])
        .join((enter) =>
          enter
            .append('rect')
            .attr('class', 'bg-rect')
            .attr('height', height)
            .attr('x', dayDotSize)
            .attr('width', marginRight - dayDotSize)
        );
  
      const ticks = y.ticks((height - marginTop - marginBottom) / 20);
  
      g.selectAll('.tick')
        .data(ticks)
        .join((enter) =>
          enter
            .append('g')
            .attr('class', 'tick')
            .call((g) => g.append('line').attr('stroke', 'currentColor'))
            .call((g) =>
              g
                .append('text')
                .attr('x', marginRight)
                .attr('dy', '0.32em')
                .attr('text-anchor', 'end')
                .attr('fill', 'currentColor')
            )
        )
        .attr('transform', (d) => `translate(0,${y(d)})`)
        .call((g) =>
          g.select('line').attr('x1', -(noScrollWidth - marginLeft - marginRight))
        )
        .call((g) => g.select('text').text((d) => d.toLocaleString()));
    }
  
    // Render series data (area and lines)
    function renderSeries() {
      svg
        .selectAll('.area-path-1')
        .data([flattenedData.map((d) => [xAccessor(d), y1Accessor(d)])])
        .join((enter) =>
          enter
            .append('path')
            .attr('class', 'area-path-1')
            .attr('fill', 'var(--clr-fill-series-1)')
        )
        .attr('d', areaGenerator);
  
      svg
        .selectAll('.area-path-2')
        .data([flattenedData.map((d) => [xAccessor(d), y2Accessor(d)])])
        .join((enter) =>
          enter
            .append('path')
            .attr('class', 'area-path-2')
            .attr('fill', 'var(--clr-fill-series-2)')
        )
        .attr('d', areaGenerator);
  
      svg
        .selectAll('.line-path-2')
        .data([flattenedData.map((d) => [xAccessor(d), y2Accessor(d)])])
        .join((enter) =>
          enter
            .append('path')
            .attr('class', 'line-path-2')
            .attr('fill', 'none')
            .attr('stroke', 'var(--clr-series-2)')
            .attr('stroke-width', lineStrokeWidth)
        )
        .attr('d', lineGenerator);
  
      svg
        .selectAll('.line-path-1')
        .data([flattenedData.map((d) => [xAccessor(d), y1Accessor(d)])])
        .join((enter) =>
          enter
            .append('path')
            .attr('class', 'line-path-1')
            .attr('fill', 'none')
            .attr('stroke', 'var(--clr-series-1)')
            .attr('stroke-width', lineStrokeWidth)
        )
        .attr('d', lineGenerator);
    }
  
    // Render x-axis
    function renderXAxis() {
      const g = svg
        .selectAll('.x-axis-g')
        .data([0])
        .join((enter) => enter.append('g').attr('class', 'x-axis-g'))
        .attr('transform', `translate(0,${height - marginBottom})`);
  
      g.selectAll('.day-dots-g')
        .data([0])
        .join((enter) =>
          enter
            .append('g')
            .attr('class', 'day-dots-g')
            .attr('transform', `translate(0,${dayDotsOffset})`)
        )
        .selectAll('.day-dot-circle')
        .data(flattenedData)
        .join((enter) =>
          enter
            .append('circle')
            .attr('class', 'day-dot-circle')
            .attr('r', dayDotSize)
        )
        .attr('cx', (d) => x(xAccessor(d)));
  
      const dayLabelsG = g
        .selectAll('.day-labels-g')
        .data([0])
        .join((enter) =>
          enter
            .append('g')
            .attr('class', 'day-labels-g')
            .attr('transform', `translate(0,${dayLabelsOffset})`)
            .call((g) => g.append('g').attr('class', 'day-labels-lines-g'))
            .call((g) => g.append('g').attr('class', 'day-labels-texts-g'))
        );
      dayLabelsG
        .select('.day-labels-lines-g')
        .selectAll('.day-labels-line')
        .data(groupedData, (d) => d.month)
        .join((enter) =>
          enter
            .append('line')
            .attr('class', 'day-labels-line')
            .attr('stroke-width', dayLabelsHeight)
        )
        .attr('x1', (d, i) => {
          const isFirstMonth = i === 0;
          return (
            x(d3.utcHour.offset(xAccessor(d.days[0]), isFirstMonth ? 0 : -12)) +
            dayLabelsHeight / 2 +
            1
          );
        })
        .attr('x2', (d, i, n) => {
          const isLastMonth = i === n.length - 1;
          return (
            x(
              d3.utcHour.offset(
                xAccessor(d.days[d.days.length - 1]),
                isLastMonth ? 0 : 12
              )
            ) -
            dayLabelsHeight / 2 -
            1
          );
        });
      dayLabelsG
        .select('.day-labels-texts-g')
        .selectAll('.day-label-month-g')
        .data(groupedData, (d) => d.month)
        .join((enter) => enter.append('g').attr('class', 'day-label-month-g'))
        .selectAll('.day-label-text')
        .data(
          (d) => d.days.filter((d) => [5, 10, 15, 20, 25].includes(d.day)),
          (d) => d.day
        )
        .join((enter) =>
          enter
            .append('text')
            .attr('class', 'day-label-text')
            .attr('fill', 'currentColor')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.4em')
            .text((d) => d.day)
        )
        .attr('x', (d) => x(xAccessor(d)));
  
      g.selectAll('.month-labels-g')
        .data([0])
        .join((enter) =>
          enter
            .append('g')
            .attr('class', 'month-labels-g')
            .attr('transform', `translate(0,${monthLabelsOffset})`)
        )
        .selectAll('.month-label-text')
        .data(groupedData, (d) => d.month)
        .join((enter) =>
          enter
            .append('text')
            .attr('class', 'month-label-text')
            .attr('fill', 'currentColor')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.32em')
            .text((d) => monthNames[d.month - 1])
        )
        .attr('x', (d) =>
          d3.mean([d.days[0], d.days[d.days.length - 1]], (d) => x(xAccessor(d)))
        );
    }
  
    // Render color swatches for legend
    function renderSwatches() {
      swatchesContainer
        .selectAll('.swatch')
        .data(['30 Tage 2023/24', '30 Tage 1973-2022'])
        .join((enter) =>
          enter
            .append('div')
            .attr('class', 'swatch')
            .call((div) =>
              div
                .append('div')
                .attr('class', 'swatch-swatch')
                .style('background-color', (_, i) => `var(--clr-series-${i + 1})`)
            )
            .call((div) =>
              div
                .append('div')
                .attr('class', 'swatch-label')
                .text((d) => d)
            )
        );
    }
  
    // Render focus dot for tooltip
    function renderFocus() {
      yAxisSvg
        .selectAll('.focus-circle')
        .data(
          tooltipDatumIndex === undefined ? [] : [pointsData[tooltipDatumIndex]]
        )
        .join((enter) =>
          enter
            .append('circle')
            .attr('class', 'focus-circle')
            .attr('r', focusDotSize)
        )
        .attr('fill', (d) => `var(--clr-series-${d.seriesId})`)
        .attr(
          'transform',
          (d) =>
            `translate(${x(d[0]) - scrollContainer.node().scrollLeft},${y(d[1])})`
        );
    }
  
    // Render tooltip
    function renderTooltip() {
      if (tooltipDatumIndex === undefined) {
        tooltip.classed('is-visible', false);
      } else {
        const d = pointsData[tooltipDatumIndex];
        const src = `./assets/temp_${d.seriesId === 1 ? 'up' : 'down'}.svg`;
        tooltip
          .html(
            `<img src="${src}" /> <span style="color: var(--clr-series-${
              d.seriesId
            })">${valueFormat(d[1])}<span>`
          )
          .classed('is-visible', true);
        const transX = x(d[0]) - scrollContainer.node().scrollLeft;
        const transXOffset = transX < noScrollWidth / 2 ? '0%' : '-100%';
        const transY = y(d[1]) - focusDotSize;
        tooltip.style(
          'transform',
          `translate(calc(${transX}px + ${transXOffset}),calc(${transY}px - 100%))`
        );
      }
    }
  
  // Event handler for mouse movement over the chart
    function mousemoved(event) {
        // Get the coordinates of the mouse pointer relative to the SVG container
      const [px, py] = d3.pointer(event, svg.node());
        // Check if the mouse pointer is outside the visible area of the chart
  
      if (
        px < scrollContainer.node().scrollLeft ||
        px > scrollContainer.node().scrollLeft + noScrollWidth - marginRight
      )
          // If outside, trigger the mouseleft event and return
        return mouseleft();
         // Find the index of the nearest data point using Delaunay triangulation
      const i = delaunay.find(px, py, tooltipDatumIndex);
        // If the index matches the current tooltip index, return without rendering
      if (tooltipDatumIndex === i) return;
        // Update the tooltip index with the new index
      tooltipDatumIndex = i;
        // Render the focus dot and tooltip at the new index
      renderFocus();
      renderTooltip();
    }
  
    // Event handler for mouse entering the chart area
    function mouseentered(event) {
        // Trigger the mousemoved event when the mouse enters the chart area
      mousemoved(event);
    }
  
    // Event handler for mouse leaving the chart area
    function mouseleft() {
       // Reset the tooltip index to undefined
      tooltipDatumIndex = undefined;
      // Render the focus dot and tooltip (if any) with the updated index
      renderFocus();
      renderTooltip();
    }
  
    // Function to process raw data and prepare it for rendering
    function processData(data) {
       // Get the current month and year for filtering data
      const currentMonth = new Date().getUTCMonth() + 1;
      const currentYear = new Date().getFullYear();
        // Filter data to include only the last three months
      const filtered = data.months.filter(
        ({ month }) => month <= currentMonth && month >= currentMonth - 3
      );
       // Group the filtered data by month and convert date strings to Date objects
      const groupedData = filtered.map(({ month, days }) => ({
        month,
        days: days.map((d) => ({
          ...d,
          date: new Date(Date.UTC(currentYear, month - 1, d.day)),
        })),
      }));
        // Flatten the grouped data structure into a single array of data points
      const flattenedData = groupedData.flatMap(({ days }) => days);
        // Create an array of pointsData containing x, y coordinates and series information
      const pointsData = [
        ...flattenedData
          .map((d) => {
            const p = [xAccessor(d), y1Accessor(d)];
            p.seriesId = 1;
            p.data = d;
            return p;
          })
          .filter((p) => p[1] !== undefined),
        ...flattenedData
          .map((d) => {
            const p = [xAccessor(d), y2Accessor(d)];
            p.seriesId = 2;
            p.data = d;
            return p;
          })
          .filter((p) => p[1] !== undefined),
      ];
        // Return processed data for rendering
      return { groupedData, flattenedData, pointsData };
    }
  }
  