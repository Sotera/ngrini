function renderDateSlider(c_name) {
    var minDate = new Date("2014-02-03T06:00:00.000Z");
    var maxDate = new Date("2014-02-17T06:00:00.000Z");

    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", "api/load_data/"+c_name, false);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send();
    var data = JSON.parse(xhttp.responseText);
    var l_res = data.length;

    var yMin = 99;
    var yMax = 10;
    var yMin2 = 100;
    var yMax2 = 100;
    for (var i=0; i< l_res; i++) {
        sd = data[i]['TRN_DATE'].split("-")
        dt = new Date( Number(sd[0]), Number(sd[1]), 10)
        data[i]["date"] = dt
        if( dt < minDate  | i==0){
            minDate = dt;
        }
        if( dt > maxDate ){
            maxDate = dt;
        }
        if( yMin > data[i]['count']){
            yMin = data[i]['count'] - 1;
        }
        if( yMax < data[i]['count']){
            yMax = data[i]['count'] + 1;
        }
        if( yMin2 > data[i]['TRN_AMT']){
            yMin2 = data[i]['TRN_AMT']*0.99;
        }
        if( yMax2 < data[i]['TRN_AMT']){
            yMax2 = data[i]['TRN_AMT']*1.01;
        }
    }

    var margin = {top: 10, right: 0, bottom: 20, left: 50};
    var container = d3.select('.nav-chart-container');
    var width = parseInt(container.style('width'));
    var height = parseInt(container.style('height'));

    var navWidth = width - margin.left - margin.right,
      navHeight = height - margin.top - margin.bottom;

    var parseTime = d3.timeFormat('%I:%M %p');

    var tooltip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-20, 20])
        .html(function(d) {
            return d.count + ' at ' + parseTime(d.date);
        });

    var navChart = d3.select('.nav-chart-container')
      .classed('chart', true).append('svg')
      .classed('navigator', true)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', 'translate(' + [margin.left, margin.top] + ')')
      .call(tooltip);

    var xScale = d3.scaleTime()
        .domain([minDate, maxDate])
        .range([width*.01, navWidth*.88]);

    var yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([navHeight, 0]);

    var yScale2 = d3.scaleLinear()
        .domain([yMin2, yMax2])
        .range([navHeight, 0]);

    var navArea = d3.area()
      .x(function(d) {
        return xScale(d.date);
      })
      .y0(navHeight)
      .y1(function(d) {
        return yScale(d.count);
      });

    var navLine = d3.line()
      .x(function(d) {
        return xScale(d.date);
      })
      .y(function(d) {
        return yScale(d.count);
      });

    var navLine2 = d3.line()
      .x(function(d) {
        return xScale(d.date);
      })
      .y(function(d) {
        return yScale2(d["TRN_AMT"])
      })

    //Color Under the curve
    //navChart.append('path')
    //.attr('class', 'data')
    //.attr('d', navArea(data));

    navChart.append('path')
      .attr('class', 'line')
      .style("stroke", "#00aafe")
      .attr('d', navLine(data));

    navChart.append('path')
      .attr('class', 'line')
      .style("stroke", "#ffae3b")
      .attr('d', navLine2(data));

    var viewport = d3.brushX()
      .on('end', function () {
        redrawChart();
      });

    var xAxis = d3.axisBottom(xScale);

    //Add axis
    navChart.append('g')
      .attr('class', 'axisGrey')
      .attr('transform', 'translate(0,' + navHeight + ')')
      .call(xAxis);

    navChart.append('g')
      .attr('class', 'axisSteelBlue')
      .call(d3.axisLeft(yScale));

    navChart.append('g')
      .attr('class', 'axisOrange')
      .call(d3.axisRight(yScale2))
      .attr("transform", "translate(" + navWidth*.93 + ", 0)");

    //Add axis labels
    navChart.append('g')
      .attr('class', 'axisSteelBlue')
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 6)
      .attr('dy', '.71em')
      .style('text-anchor', 'end')
      .text('Number of Transactions');

    navChart.append('g')
      .attr('class', 'axisOrange')
      .append('text')
      .attr("transform", "translate(" + navWidth*.9 + ", 0), rotate(-90)")
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text('Total Funds Sent');

    function redrawChart() {
      var start = xScale.invert( d3.event.selection[0] ).toJSON().split("T")[0];
      var end = xScale.invert( d3.event.selection[1] ).toJSON().split("T")[0];
      console.log(start);
      console.log(end);
      renderStatTable(c_name, start, end);
    }

    navChart.append('g')
      .attr('class', 'viewport')
      .call(viewport)
      .selectAll('rect')
      .attr('height', navHeight);

    // add tooltips
    navChart.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'circle')
      .attr('cx', function(d) {
        return xScale(d.date);
      })
      .attr('cy', function(d) {
        return yScale(d.count);
      })
      .attr('cy2', function(d) {
        return yScale2(d["Transfer Amount"]);
      })
      .attr('r', 4)
      .on('mouseover', tooltip.show)
      .on('mouseout', tooltip.hide);
}
