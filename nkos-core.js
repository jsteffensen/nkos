var height, width, centerX, centerY, viewBoxAttrValue, svg, links, predicates, nodes, simulation, dragging;

function testClick() {
  overlayOn();

  setTimeout(function(){
    overlayOff();
  }, 1000);
}

function overlayOn() {
  console.log('on');
  document.getElementById("overlay").style.display = "block";
}

function overlayOff() {
  console.log('off');
  document.getElementById("overlay").style.display = "none";
}

$(function() {
  init();
});

function init() {

  //$('#sharepoint-tunnel').attr('src', baseURL);

  $('#search-input').keyup(function(event) {
    if ( event.which == 13 ) {
      event.preventDefault();
      searchVertices();
    }
  });

  initD3ForceLayout().then(function() {
    return insertTestData();
  }, function(error) {console.log(error)}).then(function() {
    return updateForceGraph();
  }, function(error) {console.log(error)}).then(function() {
    appendDocuments();
  }, function(error) {console.log(error)});
}

function searchVertices() {

  $('#search-list').empty();

  $('#modalSearch').modal('show');

  term = $('#search-input').val();

  getVerticesSearchResults(term).then(function(data) {

    uniqueResults = [];

    data.d.results.forEach((vertex) => {

      isDuplicateGuid = _.some(uniqueResults, function(o) {
        return o.Guid === vertex.Guid;
      });

      if(!isDuplicateGuid) {
        uniqueResults.push(vertex);
      }
    });

    uniqueResults.forEach((uniqueVertex)=>{
      $('#search-list').append(getSearchHTML(uniqueVertex));
    });
    
    if(data.d.results.length == 0) {
      $('#search-list').append('<p>No results.</p>');
      setTimeout(function() {
        $('#search-list').empty();
        $('#modalSearch').modal('hide');
      }, 1000);
    }
  });

  $('#search-input').val('');
  $('#search-input').blur();
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
      .force('charge', d3.forceManyBody().strength(-300))
      .force('charge', d3.forceManyBody().theta(0))
      .force('collision', d3.forceCollide().radius(100));

    resolve();

  });
}

function appendDocuments() {
  selectedNode.documents.forEach(function(doc) {
    element = documentHTML(doc);
    element.hide();
    $('#document-list').append(element);
    element.slideDown( 'slow' );
  });

}


function documentHTML(document) {

  elementA = $('<a></a>', {'href': '#', 'class': 'list-group-item list-group-item-action py-3 lh-tight'});
  elementDiv = $('<div></div>', {'class': 'd-flex w-100 align-items-center justify-content-between'});
  elementDivTitle = $('<strong></strong>', {'class': 'mb-1'});
  elementDivTitle.text(document.title);
  elementDivDate = $('<small></small>');
  elementDivDate.text(document.date);
  elementDivDescription = $('<div></div>', {'class': 'col-10 mb-1 small'});
  elementDivDescription.text(document.description);

  elementDiv.append(elementDivTitle);
  elementDiv.append(elementDivDate);
  elementA.append(elementDiv);
  elementA.append(elementDivDescription);

  return elementA;

}

function updateForceGraph() {
  return new Promise(function(resolve, reject) {

    links = links.data(graph.links);
    links.exit().transition()
      .attr("stroke-opacity", 0)
      .attrTween("x1", function(d) { return function() { return d.source.x; }; })
      .attrTween("x2", function(d) { return function() { return d.target.x; }; })
      .attrTween("y1", function(d) { return function() { return d.source.y; }; })
      .attrTween("y2", function(d) { return function() { return d.target.y; }; })
      .remove();

    links = links.enter().append('line')
    .attr('class', 'line')
    .attr('id', function(d) {
      return d.id;
    })
    .attr('title', function(d) {
      return d.title;
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
    .attr('class', 'predicate')
    .text(function(d) {
       return d.title;
     })
    .attr('id', function(d) {
      return d.id;
    })
    .style('font-family', 'monospace')
    .style('fill', 'blue')
    .merge(predicates);

    nodes = nodes.data(graph.nodes);
    nodes.exit().transition()
      .attr('r', 0)
      .remove();

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

  // cool down quicker
  if(!dragging) {
    simulation.tick(10);
  }

  nodes.attr('transform', function(d) {
      if(d.id == selectedNode.id) {
        d.x = width/2;
        d.y = height/2; 
      }
      return 'translate(' + d.x + ',' + d.y + ')'; 
    });

  links.attr('x1', function(d) { return d.source.x; })
      .attr('y1', function(d) { return d.source.y; })
      .attr('x2', function(d) { return d.target.x; })
      .attr('y2', function(d) { return d.target.y; });

  predicates.attr('x', function(d) { return ((d.source.x + d.target.x)/2) + 10; })
      .attr('y', function(d) { return (d.source.y + d.target.y)/2; });

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

function dragstarted(event, d) {
  dragging = true;
  if (!event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(event, d) {
  d.fx = event.x;
  d.fy = event.y;
}

function dragended(event, d) {
  dragging = false;
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

function nodeMouseover(d) {

}

function linkMouseover(event, d) {
  d3.select(this).attr('marker-end', '').attr('stroke', 'green').attr('stroke-width', '12');
  console.log(d.title);
}

function linkMouseout(event, d) {
  d3.select(this).attr('marker-end', 'url(#arrowhead)').attr('stroke', 'black').attr('stroke-width', '1');
}

function nodeClick(event, d) {
  if(d.id != selectedNode.id) {
    selectedNode = d;
  }
}

function linkClick(event, d) {
  console.log(d);
}