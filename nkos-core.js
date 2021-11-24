// Revisions: https://sharepoint/sites/collaboration/fipt/gs/_vti_history/13824/SiteAssets/nkos/nkos-core.js
// D3js docs
// https://github.com/d3/d3/blob/main/API.md

var height, width, centerX, centerY, viewBoxAttrValue, svg, links, predicates, nodes, dragLine, simulation, dragging;

function logSVG() {
  console.log( $('.drag-line').each(function(i) {console.log( $(this).html() );}) );
}

function testClick() {
  logSVG();
}

function overlayOn() {
  console.log('on');
  document.getElementById("overlay").style.display = "block";
}

function overlayOff() {
  console.log('off');
  document.getElementById("overlay").style.display = "none";
}

function updateUI() {

  getData().then(function() {
    return updateForceGraph();
  }, function(error){console.log(error)}).then(function() {
    return appendDocuments();
  }, function(error){console.log(error)});
}

$(function() {
  init();
});

function init() {

  $('#sharepoint-tunnel').attr('src', baseURL);

  $('#search-input').keyup(function(event) {
    if ( event.which == 13 ) {
      event.preventDefault();
      searchVertices();
    }
  });

  var modalAddNode = document.getElementById('modalAddNode');
  modalAddNode.addEventListener('shown.bs.modal', function (event) {
    $('#add-connection-title').text( selectedNode.class + ':' +selectedNode.title );
    $('#selected-node-input').val( selectedNode.class + ':' +selectedNode.title );
  });

  var modalDocument = document.getElementById('modalDocument');
  modalDocument.addEventListener('shown.bs.modal', function (event) {

    iframeSrc = 'https://sharepoint/sites/collaboration/fipt/gs/nkosdocuments/Forms/UploadView.aspx?IsDlg=1';
    $('#uploadIframe').attr('src', iframeSrc);

    $('#uploadIframe').on('load', function(){
      $('#uploadIframe').contents().find('#s4-ribbonrow').css('display', 'none');
      $('#uploadIframe').contents().find('#Hero-WPQ2').css('display', 'none');
              
      $('#uploadIframe').contents().find('#CSRListViewControlDivWPQ2').css('display', 'none');
      $('#uploadIframe').contents().find('#js-listviewthead-WPQ2').css('display', 'none');

      $('#uploadIframe').contents().find('#onetidDoclibViewTbl0') .find('tbody').css('display', 'none');

      $('#uploadIframe').contents().find('#bottomPagingWPQ2').css('display', 'none');

      $('#uploadIframe').show();
    });
  });

  modalDocument.addEventListener('show.bs.modal', function (event) {
    // hide uploadframe until mods in .on('load') has finished
    $('#uploadIframe').hide(); 
  });

  modalDocument.addEventListener('hidden.bs.modal', function (event) {
    $('#uploadIframe').attr('src', '');
    updateUI();
  });

  initD3ForceLayout().then(function() {
    
    setTimeout(function() {
      loadRootNode();
    }, 3);

  }, function(error) {console.log(error)});
}

function searchVertices() {

  $('#search-list').empty();

  $('#modalSearch').modal('show');

  term = $('#search-input').val();

  getVerticesSearchResults(term).then(function(data) {

    uniqueResults = [];

    data.d.results.forEach((vertex) => {
      isDuplicateSharedId = _.some(uniqueResults, function(o) {
        return o.Guid === vertex.Guid;
      });

      if(!isDuplicateSharedId) {
        vertex.title = vertex.Title;
        vertex.class = vertex.Class;
        vertex.description = vertex.Description;
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

function clearSearch() {
  $('#search-list').empty();
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
    
    dragLine = svg.append('line')
      .attr('class', 'drag-line shadow')
      .attr('stroke', '#000')
      .attr('stroke-width', '1')
      .attr('marker-end', 'url(#arrowhead)');

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

<!-- HTML generators -------------------------------------------------------------------------- -->

function getSearchHTML(listItem) {

  vertex = vertexFromListItem(listItem);

  elementA = $('<a></a>', {'href': '#', 'class': 'list-group-item list-group-item-action py-3 lh-tight'});
  elementDiv = $('<div></div>', {'class': 'd-flex w-100 align-items-center justify-content-between'});
  elementDivTitle = $('<strong></strong>', {'class': 'mb-1'});
  elementDivTitle.text(vertex.title);
  elementDivClass = $('<small></small>');
  elementDivClass.text('Class: ' + vertex.class);
  elementDivDescription = $('<div></div>', {'class': 'col-10 mb-1 small'});
  elementDivDescription.text(vertex.description);

  elementDiv.append(elementDivTitle);
  elementDiv.append(elementDivClass);
  elementA.append(elementDiv);
  elementA.append(elementDivDescription);

  elementA.click(function() {

    $('#search-list').empty();

    htmlModal = document.getElementById('modalSearch');
    bsModal = bootstrap.Modal.getInstance(htmlModal);
    bsModal.hide();
    bsModal.dispose();

    selectNode(vertex);

  });

  return elementA;
}

function selectNode(vertex) {
  selectedNode = vertex;
  updateUI();
}

function documentHTML(document) {

  elementA = $('<a></a>', {'href': '#', 'class': 'list-group-item list-group-item-action py-3 lh-tight document-list-item'});
  elementDiv = $('<div></div>', {'class': 'd-flex w-100 align-items-center justify-content-between'});
  elementDivTitle = $('<strong></strong>', {'class': 'mb-1'});
  elementDivTitle.text(document.title);

  elementPinIcon = $('<i></i>');

  if(document.nodeId != '-') {
    elementPinIcon.addClass('bi-pin-fill');
    elementPinIcon.attr('title', 'Click to unpin from ' + selectedNode.class + ':' + selectedNode.title);
  } else {
    elementA.addClass('orphan');
    elementPinIcon.addClass('bi-pin-angle');
    elementPinIcon.attr('title', 'Click to pin on ' + selectedNode.class + ':' + selectedNode.title);
  }

  elementPinIcon.css('font-size', '1rem');
  elementPinIcon.css('cursor', 'pointer');


  elementDivBlock = $('<div></div>', {'style': 'display: block;'});

  elementDivDate = $('<div></div>', {'class': 'col-10 mb-1 small'});
  elementDivDate.text(document.date);

  elementDivDescription = $('<div></div>', {'class': 'col-10 mb-1 small'});
  elementDivDescription.text(document.description);

  elementDiv.append(elementDivTitle);
  elementDiv.append(elementPinIcon);
  elementDivBlock.append(elementDivDate);
  elementDivBlock.append(elementDivDescription);
  elementA.append(elementDiv);
  elementA.append(elementDivBlock);

  elementPinIcon.click(function(event) {
    event.stopPropagation();
    pinDocument(document);
  });

  elementA.click(function(event) {
    openDocument(document);
  });

  return elementA;
}

<!-- /HTML generators ------------------------------------------------------------------------- -->

function updateForceGraph() {

  return new Promise(function(resolve, reject) {

    links = links.data(graph.links, function(d) { return d.source.id + "-" + d.target.id; });
    links.exit().remove();

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
    .call(d3.drag()
      .on('start', linkDragStart)
      .on('drag', linkDragging)
      .on('end', linkDragEnd)
    )
    .merge(links);


    predicates = predicates.data(graph.links, function(d) { return 'p' + d.id;});
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

    nodes = nodes.data(graph.nodes, function(d) { return d.id;});
    nodes.exit().remove();

    nodeG = nodes.enter().append('g')
      .attr('class', function(d) { 
        return d.class;
      })
      .attr('id', function(d) { return d.id; })
      .on('mouseover', nodeMouseover)
      .on('click', nodeClick)
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );

    nodeG.append('circle')
      .attr('r', 10)
      .attr('class', 'node-circle shadow')
      .style('fill', '#ccc')
      .style('stroke', '#555');

    nodeG.append('text')
      .text(function(d) {
        return d.type + ':' + d.title;
      })
      .attr('x', 16)
      .attr('y', 5)
      .attr('class', 'node-label')
      .style('font-family', 'monospace');

    nodeG.append('title')
      .text(function(d) {
        return d.id;
      });

    nodes = nodes.merge(nodeG);    

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

      // override d.x d.y to fix selected node to center
      if(d.id == selectedNode.id) {
        d.x = width/2;
        d.y = height/2; 
      }

      // override d.x d.y to fix previously selected node to bottom center
      if(previousNode) {
        if(d.id == previousNode.id) {
          d.x = width/2;
          d.y = (height/4)*3; 
        }
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

function appendDocuments() {

  return new Promise(function(resolve, reject) {

    $('#document-list').empty();

    orphanDocuments.forEach(function(doc) {
      element = documentHTML(doc);
      element.hide();
      $('#document-list').append(element);
      element.slideDown( 'slow' );
    });

    selectedNode.documents.forEach(function(doc) {
      element = documentHTML(doc);
      element.hide();
      $('#document-list').append(element);
      element.slideDown( 'slow' );
    });

    resolve();
  });
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
}

function linkMouseout(event, d) {
  d3.select(this).attr('marker-end', 'url(#arrowhead)').attr('stroke', 'black').attr('stroke-width', '1');
}

function nodeClick(event, d) {
  if(d.id != selectedNode.id) {

    if(selectedNode.id != 0) {
      previousNode = selectedNode;
    }
    loadVertexById(d.id);
  }
}

function linkClick(event, d) {
  console.log(d);
}

function linkDragStart(event, d){

  d3.select(this).style('display', 'none');
  dragLine.style('display', 'block');

  startX = event.x;
  startY = event.y;

  distanceHead = distanceBetweenCoords(startX, startY, d.target.x, d.target.y);
  distanceTail = distanceBetweenCoords(startX, startY, d.source.x, d.source.y);

  if(distanceHead < distanceTail) {
    d.dragging = 'head';
  } else {
    d.dragging = 'tail';
  }

  if(d.dragging == 'head') {
    dragLine
      .attr('x1', d.source.x)
      .attr('y1', d.source.y)
      .attr('x2', event.x)
      .attr('y2', event.y);
  } else {
    dragLine
      .attr('x1', event.x)
      .attr('y1', event.y)
      .attr('x2', d.target.x)
      .attr('y2', d.target.y);
  }

}

function linkDragging(event, d){
  if(d.dragging == 'head') {
    dragLine
      .attr('x1', d.source.x)
      .attr('y1', d.source.y)
      .attr('x2', event.x)
      .attr('y2', event.y);
  } else {
    dragLine
      .attr('x1', event.x)
      .attr('y1', event.y)
      .attr('x2', d.target.x)
      .attr('y2', d.target.y);
  }
}

function linkDragEnd(event, d){
  d3.select(this).style('display', 'block');
  dragLine.style('display', 'none');

  var persistentEndTitle;
  if(d.dragging == 'head') {
    persistentEndTitle = d.source.type + ':' + d.source.title;
  } else {
    persistentEndTitle = d.target.type + ':' + d.target.title;
  }

  for(i=0; i<graph.nodes.length; i++) {
    distance = distanceBetweenCoords(event.x, event.y, graph.nodes[i].x, graph.nodes[i].y)
    foundNode = false;
    if(distance < 20) {

      var makeUpdate;
      if(d.dragging == 'head') {
        makeUpdate = confirm('Connect ' + persistentEndTitle + ' to ' + graph.nodes[i].type + ':' + graph.nodes[i].title);
      } else {
        makeUpdate = confirm('Connect ' + graph.nodes[i].type + ':' + graph.nodes[i].title + ' to ' + persistentEndTitle);
      }

      if (makeUpdate) {
        updateEdge(d.id, d.dragging, graph.nodes[i].id).then(function() {
          updateUI();
        }, function(error) {console.log(error);});
      }

      foundNode = true;
      break;
    }
  }

  if(!foundNode) {
    console.log('Did not find node within 20 pixels');
  }

  delete d.dragging;
}

function isModalPredicateArrowDown() {
  classList = $('#predicate-direction').prop('classList').toString();
  return classList.indexOf('bi-arrow-down') > -1;
}

function toggleModalPredicateDirection() {

  isArrowDown = isModalPredicateArrowDown()

  if(isArrowDown) {
    $('#predicate-direction').removeClass('bi-arrow-down');
    $('#predicate-direction').addClass('bi-arrow-up');
  } else {
    $('#predicate-direction').removeClass('bi-arrow-up');
    $('#predicate-direction').addClass('bi-arrow-down');
  }
  
}

function clearModalAddNode() {


    $('#node-title-input').val('');
    $('#node-class-input').val('');
    $('#node-description-input').val('');
    $('#node-predicate-input').val('');

    $('#predicate-direction').removeClass('bi-arrow-down');
    $('#predicate-direction').addClass('bi-arrow-up');
}

function distanceBetweenCoords(x1, y1, x2, y2) {

  xDistance = Math.abs(x1 - x2);
  yDistance = Math.abs(y1 - y2);

  return Math.sqrt(Math.pow(xDistance,2) + Math.pow(yDistance,2));
}

//-------------------------------------- document behaviour

function openDocument(document) {

  if(isWord(document) || isPowerPoint(document) || isExcel(document)) {
    guid = document.__metadata.media_etag.split(',')[0].replace('"', '');
    url = 'https://sharepoint/sites/collaboration/fipt/gs/_layouts/15/WopiFrame.aspx?sourcedoc=' + guid + '&action=view';
    window.open(url);
  } else if(isSvg(document) || isPdf(document)) {
    window.open(document.__metadata.media_src);
  } else {
    window.open(document.DocumentID.split(',')[0]);
  }
}

function pinDocument(document) {
  if(document.nodeId != '-') { // document has valid id so toggle to unpinned
    setPin(document, '-').then(function() {
      updateUI();
    });
  } else { // pin to selected node
    setPin(document, '' + selectedNode.id).then(function() {
      updateUI();
    });
  }

}

function getExtension(fileName) {
  splitByDots = fileName.split('.');
  return  splitByDots[splitByDots.length-1].toLowerCase();
}

function isWord(document) {
  extension = getExtension(document.Name);

  if(extension == 'docx' || extension == 'dotx' || extension == 'docm' || extension == 'dotm' || extension == 'doc' || extension == 'dot' || extension == 'odt') {
    return true;
  } else {
    return false;
  }

}

function isPowerPoint(document) {
  extension = getExtension(document.Name);
  if(extension == 'pptx' || extension == 'ppt') {
    return true;
  } else {
    return false;
  }
}

function isExcel(document) {
  extension = getExtension(document.Name);
  if(extension == 'xlsx' || extension == 'xls' || extension == 'csv') {
    return true;
  } else {
    return false;
  }
}

function isPdf(document) {
  extension = getExtension(document.Name);
  if(extension == 'pdf') {
    return true;
  } else {
    return false;
  }
}

function isMsg(document) {
  extension = getExtension(document.Name);
  if(extension == 'msg') {
    return true;
  } else {
    return false;
  }
}

function isSvg(document) {
  extension = getExtension(document.Name);
  if(extension == 'svg') {
    return true;
  } else {
    return false;
  }
}