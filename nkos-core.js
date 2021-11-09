var height, width, centerX, centerY, viewBoxAttrValue, svg, link, predicate, node, simulation;

$(function() {
  init();
});

function init() {
  initD3ForceLayout().then(function() {
    return insertTestData();
  }, function(error) {console.log(e)}).then(function() {
    return updateForceGraph();
  }, function(error) {console.log(e)});
}

function initD3ForceLayout() {

  return new Promise(function(resolve, reject) {

    height = $('svg#canvas').height();
    width = $('svg#canvas').width();
    centerX = width/2;
    centerY = height/2;
    viewBoxAttrValue = '0 0 ' + width + ' ' + height;

    svg = d3.select('svg#canvas')
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', viewBoxAttrValue)
      .classed('svg-content', true);

    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('markerWidth', '100')
      .attr('markerHeight', '70')
      .attr('refX', '24')
      .attr('refY', '5')
      .attr('orient', 'auto')
      .append('polygon')
      .attr('points', '0 0, 15 5, 0 10')
      .attr('fill', '#4e8144');

    links = svg.append('g').attr('class', 'links').selectAll('.link');
    predicates = svg.append('g').attr('class', 'predicates').selectAll('.predicate');
    nodes = svg.append('g').attr('class', 'nodes').selectAll('.node');

    simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(function(d) { return d.id; }).distance(function(d) {return 5;}))
      .force('x', d3.forceX(width/2))
      .force('y', d3.forceY(height/2))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('charge', d3.forceManyBody().theta(0))
      .force('collision', d3.forceCollide().radius(60));

    resolve();

  });
}

function updateForceGraph() {
  return new Promise(function(resolve, reject) {

    links = links.data(graph.links);
    links.exit().remove();
    links = links.enter().append('line')
    .attr('class', 'line')
    .attr('id', function(d) {
      return d.id;
    })
    .attr('stroke', '#000')
    .attr('stroke-width', '1')
    .attr('marker-end', 'url(#arrowhead)')
    .on('mouseover', linkMouseover)
    .on('mouseout', linkMouseout)
    .on('click', linkClick)
    .merge(links);

    predicates = predicates.data(graph.links);
    predicates.exit().remove();
    predicates = predicates.enter().append('text')
    .text(function(d) {
       return d.title;
     })
    .attr('class', function(d) {
      return 'predicate';
    })
    .style('font-family', 'monospace')
    .merge(predicates);

    nodes = nodes.data(graph.nodes);
    nodes.exit().remove();

    enter = nodes.enter().append('g')
      .attr('class', function(d) { 
        return d.class;
      })
      .attr('id', function(d) { return d.id; });

    enter.append('circle')
		.attr('r', function(d) {
                  return d.id == selectedNode.Id ? 12 : 8; 
                })
                .attr('class', function(d) { return d.id == selectedNode.Id ? 'node-circle selected' : 'node-circle'; })
		.style('fill', function(d) { return '#ccc'; })
                .style('stroke', function(d) { return '#ccc'; });

    enter.append('text')
      .text(function(d) {
        return d.class + ':' + d.title;
      })
      .attr('x', function(d) {return d.id == selectedNode.Id ? 18 : 10})
      .attr('y', 3)
      .attr('class', 'node-label')
      .style('font-family', 'monospace');

    enter.append('title')
      .text(function(d) {
        return d.title; 
      });

    enter.on('mouseover', nodeMouseover);
    enter.on('click', nodeClick);
    enter.call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended)
    );

    nodes = nodes.merge(enter);

    simulation.nodes(graph.nodes).on('tick', ticked);
    simulation.force('link').links(graph.links);
    simulation.alpha(1).restart();
    resolve();

  });
}

function ticked() {

  links.attr('x1', function(d) { return d.source.x; })
      .attr('y1', function(d) { return d.source.y; })
      .attr('x2', function(d) { return d.target.x; })
      .attr('y2', function(d) { return d.target.y; });

  nodes.attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; });
}


function nodeColor(type) {
    switch(type) {
      case 'folder':
        return 3;
      default:
        return 2;
    }
}

////////// events //////////////////////////////////////////////////////////////////

function dragstarted(d) {

}

function dragged(d) {

}

function dragended(d) {

}

function nodeMouseover(d) {

}

function linkMouseover(d) {
  d3.select(this).attr('marker-end', '');
}

function linkMouseout(d) {
  d3.select(this).attr('marker-end', 'url(#arrowhead)');
}

function nodeClick(d) {

}

function linkClick(d) {

}
