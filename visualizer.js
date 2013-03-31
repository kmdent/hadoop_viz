
function circleCoords(radius, steps, centerX, centerY) {
    var xValues = [centerX];
    var yValues = [centerY];
    for (var i = 1; i < steps; i++) {
        xValues[i] = (centerX + radius * Math.cos(2 * Math.PI * i /
                                                  steps-Math.PI/2));
        yValues[i] = (centerY + radius * Math.sin(2 * Math.PI * i /
                                                  steps-Math.PI/2));
   }
    yValues[0] = yValues[0] - radius;
    return {x : xValues, y : yValues};
}

function updateServers(SVG, coords, rad, servers) {
    var xValues = coords.x;
    var yValues = coords.y;
    var dataset = [];

    // Create the Dataset
    for (var server in servers) {
        if (servers.hasOwnProperty(server) && server != "size") {
            dataset.push(server);
        }
    }


    // Create the Fucking circles
    // http://stackoverflow.com/questions/13615381/d3-add-text-to-circle
    for(i = 0; i < xValues.length; i++) {
        SVG.append("circle")
            .style("stroke", "gray")
            .style("fill", "white")
            .attr("r", rad)
            .attr("cx", xValues[i])
            .attr("cy", yValues[i])
            .on("mouseover", function(){d3.select(this).style("fill","aliceblue");})
            .on("mouseout", function(){d3.select(this).style("fill", "white");});
    }

    var circles = SVG.selectAll("circle")
            .data(dataset);

    // TODO: This still isn't that efficient
    // Return a map of addresses to circles
    for (var i = 0; i < circles.length; i++) {
        servers[dataset[i]] = circles[i];
    }
    return servers;
}


/* buidFlowMap flows -> {time: {src : "10.", dst : "10."}}
 * This function is where the heavy lifting happens. We scroll through
 *  all the flows and build a relevent map of changes in flows over
 *  time. Note: this in a CHANGE map.
*/

function buildFlowMap(flows, time_stats) {
    
}


/*
 * processFile input_file_text -> creates simulation
 * This function is called once the whole file is read in. It gets
 * some details from the inputted json as well as initiates the
 * setup sequence
 */
function processFile(text){
    var flows = JSON.parse(text);
    var servers = getServers(flows);
    var time_stats = generateTimeStats(flows);

    var flow_map = buildFlowMap(flows, time_stats);
    console.log(flows);
    console.log(time_stats);

    setup(servers, flows, time_stats);
}

/*
 * getTimeStats input -> {max_time : t1, min_time : t2}
 * This function is pretty straight forward, it generates the max and
 * minimum times of the traces. This should be put in sync with get
 *  servers, but I will worry about that later
 */

function generateTimeStats(input) {
    var ret = {"min" : 1000000000000000, "max" : 0};
    for (var flow in input) {
        if (input.hasOwnProperty(flow)) {
            var timestamp = null;

            /* Checking to make sure it has a tags field and getting
             * the timestamp out*/
            var tags = input[flow]["trace-tags"];
            if (tags.length > 0) {
                timestamp = tags[0].timestamp;
                if (timestamp < ret["min"]) {
                    ret["min"] = timestamp;
                }
            }

            /* Checking to make sure there is the tstat field/ getting
             * max */
            var tstat = input[flow]["tstat"];
            if (tstat.length <= 1) {

                // 88th entry is the length of the request
                var time_end = parseInt(tstat[0][88]);
                if ((timestamp + time_end) > ret["max"]) {
                    ret["max"] = (timestamp + time_end);
                }
            }
        }
    }
    return ret;
}

/*
 * getServers Input json -> {server1 : 1, server2 : 2 ... }
 * This function gets the servers from all of the flows. It also adds
 *  a size field to the object to get how many servers are used. It is
 * currently not that efficient, but we will leave that as a TODO
 */
function getServers(input) {
    var servers = {"size" : 0};
    for (var flow in input) {
        if (input.hasOwnProperty(flow)) {

            //Checking to make sure it has a tags field
            var tags = input[flow]["trace-tags"];
            if (tags.length > 0) {
                var src = tags[0].source;

                // Got to keep track of the size
                if (servers[src] != 1) {
                    servers.size += 1;
                    servers[src] = 1;
                }
            }
        }
    }
    return servers;
}

function setup(servers, flows, time_stats) {

    // Initialize the canvas
    var SVG = d3.select("#viz").append("svg")
            .attr("width", 600)
            .attr("height", 600);
    var numServers = servers.size;
    // Info About Servers
    var svgSize = {x : 600, y : 600};
    var serverCircleRadius = 250;
    var serverRadius = 35;

    // Calculate the locations of the servers
    var serverLayout = circleCoords(serverCircleRadius, numServers,
                                    svgSize.x/2, svgSize.y/2);

    console.log(numServers);
    // Create the SVG objects
    updateServers(SVG, serverLayout, serverRadius, servers);
    setupSlider(SVG, time_stats);
}

function setupSlider(SVG, ts) {
    $(function() {
        $( "#slider-range-max" ).slider({
            range: "max",
            min: 0,
            max: ts["max"] - ts["min"],
            value: 1,
            slide: function( event, ui ) {
                //console.log(ui.value);
            }
        });
    });
}
