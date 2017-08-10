function renderStatTable(c_name, min_dt, max_dt) {
    //Get data from Flask Rest Service
    //////////////////////////////////
    var xhttp = new XMLHttpRequest();
    str_req = "leads/stats_data?col="+c_name
    if(min_dt != null && max_dt != null){
        str_req = str_req + "&min_dt=" + min_dt + "&max_dt=" + max_dt
    }
    xhttp.open("GET", str_req, false);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send();
    var o_res = JSON.parse(xhttp.responseText);
    //Create Stats Table
    ////////////////////
    var data = o_res["stats"]
    var tab = '';
    for( var key in data) {
        dat = data[key].valueOf()
        for( k in dat){
            if (dat.hasOwnProperty(k)) {
                tab += '<tr>';
                tab += '<td><b>' + k + '</b></td><td>' + dat[k] + '</td>';
                tab += '</tr>';
            }
        }
    }
    var pt = $('stat-table');
    $('.stat-table').html(tab);

    //Create Low Occupancy Histogram
    ////////////////////////////////
    $('.low_hist').empty();
    renderBarChart(o_res.low_hist, ".low_hist");
    $('.high_hist').empty();
    renderBarChart(o_res.high_hist, ".high_hist");
    $('.benfords_law1').empty();
    renderExObChart(o_res.lead, ".benfords_law1");
    $('.benfords_law1_mini').empty();
    renderMiniChart(o_res.lead, ".benfords_law1_mini");
    $('.benfords_law2').empty();
    renderExObChart(o_res.pair, ".benfords_law2");
    $('.benfords_law2_mini').empty();
    renderMiniChart(o_res.pair, ".benfords_law2_mini");
}

function renderBarChart(data, class_n){
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

    var tooltip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-20, 20])
        .html(function(d) {
            return d.occ;
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

    g.call(tooltip);
    g.selectAll(".bar")
      .data(data)
      .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.bins); })
        .attr("y", function(d) { return y(d.occ); })
        .attr("width", x.bandwidth() * .9)
        .attr("height",
                function(d) {
                    return height - y(d.occ);
                } )
        .on('mouseover', tooltip.show)
        .on('mouseout', tooltip.hide);
}

