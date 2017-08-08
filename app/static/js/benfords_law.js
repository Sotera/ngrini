

function renderExObChart(data, class_n){
    var svg = d3.select(class_n),
        margin = {top:10, right: 0, bottom:50, left:50},
        width = parseInt(svg.style('width')) - margin.left - margin.right,
        height = parseInt(svg.style('height')) - margin.top - margin.bottom;

    var x = d3.scaleBand().rangeRound([0, width]),
        y = d3.scaleLinear().rangeRound([height, 0]);

    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain(data.map(function(d) { return d.bins; }));
    y.domain([0, d3.max(data, function(d) { return d.occ; })]);

    var navExLine = d3.line()
        .x(function(d) {
            return x(d.bins);
        })
        .y(function(d) {
            return y(d.occ);
        });

    g.append("g")
        .attr("class", "axisGrey")
        .attr("transform", "translate(0, " + height + ")")
        .call(d3.axisBottom(x))
      .selectAll("text")
        .attr("dx", "-.8em")
        .attr("dy", ".35em")
        .attr("transform", "rotate(-65)")
        .style("text-anchor", "end");

    g.append("g")
        .attr("class", "axisGrey")
        .call(d3.axisLeft(y))
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text("Frequency");

    g.append('path')
        .attr('class', 'line')
        .style("stroke", "#ffae3b")
        .attr('d', navExLine(data));

    g.selectAll(".bar")
      .data(data)
      .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.bins); })
        .attr("y", function(d) { return y(d.occ); })
        .attr("width", x.bandwidth())
        .attr("height",
                function(d) {
                    return height - y(d.occ);
                } );

}

function renderMiniChart(data, class_n){
    var svg = d3.select(class_n),
        margin = {top:10, right: 0, bottom:50, left:50},
        width = parseInt(svg.style('width')) - margin.left - margin.right,
        height = parseInt(svg.style('height')) - margin.top - margin.bottom;

    var x = d3.scaleBand().rangeRound([0, width]),
        y = d3.scaleLinear().rangeRound([height, 0]);

    var g = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain(data.map(function(d) { return d.bins; }));
    y.domain([0, d3.max(data, function(d) { return d.occ; })]);

    var navExLine = d3.line()
        .x(function(d) {
            return x(d.bins);
        })
        .y(function(d) {
            return y(d.occ);
        });

    g.append('path')
        .attr('class', 'line')
        .style("stroke", "#7fc14b")
        .attr('d', navExLine(data));
}

