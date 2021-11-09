var height, width, centerX, centerY, viewBoxAttrValue, svg, link, predicate, node, simulation;

$(function() {
  init();
});

function init() {
  initD3ForceLayout().then(function() {

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
      .force('charge', d3.forceManyBody().strength(-100))
      .force('charge', d3.forceManyBody().theta(0))
      .force('collision', d3.forceCollide().radius(60));

    resolve();

  });
}
