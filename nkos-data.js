// vertex schema:
// {'title':'my node1', 'id':'1', 'sharedId':'some-text-id', 'hasSharedId': true, 'class':'someType', 'edges':[], 'documents':[], 'versions':[]};
// document schema:
// {'title':'my document', 'id':1, 'date':'28-Jan-2020', 'nodeId':'1', 'description':'lorem ipsum'};
// link schema:
// {'id': '2', 'source':'3', 'target':'1', 'title':'uses'}

var userId, selectedNode, previousNode, graph, orphanDocuments;

function loadVertexById(id) {
  getVertexById(id).then(function(data) {
    selectNode(vertexFromListItem(data.d[0]));
  }, function(error){console.log(error)});
}

function loadRootNode() {
  loadVertexById('2');
}

function clearSelected() {
  selectedNode = {};
  selectedNode.id = 0;
  selectedNode.documents = [];

  previousNode = {};
  previousNode.id = 0;
}

function clearGraph() {

  graph = {};
  graph.nodes = [];
  graph.links = [];
}

function getData() {

    clearGraph();

    s = selectedNode;

    return getVersions(s).then(function(data) {
      return handleVersions(s, data);
    }, function(e) {console.log(e);}).then(function(data) {
      return getEdges(data);
    }, function(e) {console.log(e);}).then(function(data) {
      return handleEdges(s, data);
    }, function(e) {console.log(e);}).then(function(data) {
      return expandEdges(data);
    }, function(e) {console.log(e);}).then(function(data) {
      return handleExpandedEdges(s, data);
    }).then(function(data) {
      return makeForceGraphData();
    }, function(e) {console.log(e);}).then(function(data) {
      return getOrphanDocuments();
    }, function(e) {console.log(e)}).then(function(data) {
      return handleOrphanDocuments(data);
    }, function(e) {console.log(e);}).then(function(data) {
      return getDocumentsByNodeId(s.id);
    }, function(e) {console.log(e)}).then(function(data) {
      return handleDocuments(s, data);
    }, function(e) {console.log(e)});

}

function hasSharedId(vertex) {

  //evaluate to false if:
  // null, undefined, NaN, empty string (''), 0, false

  if(vertex.sharedId) {
    return true;
  } else {
    return false;
  }
}

function handleVersions(vertex, data) {
  return new Promise(function(resolve, reject) {
    vertex.versions = [];
    data.d.results.forEach((v)=>{
      vertex.versions.push(v);
    });
    resolve(vertex);
  });
}

function handleEdges(vertex, data) {
  return new Promise(function(resolve, reject) {
    vertex.edges = [];
    data.d.results.forEach((listItem)=>{
      vertex.edges.push(edgeFromListItem(listItem));
    });
    resolve(vertex);
  });
}

function expandEdges(vertex) {

    queries = [];
    vertex.edges.forEach((edge)=>{

      if(edge.Head != vertex.id) {
        queries.push(getVertexById(edge.Head));
      }

      if(edge.Tail != vertex.id) {
        queries.push(getVertexById(edge.Tail));
      }

    });

    return Promise.all(queries);
}

function isSharedId(string) {
  return isNaN(string);
}

function handleExpandedEdges(vertex, allData) {
  return new Promise(function(resolve, reject) {

    allData.forEach((data)=>{

      if(data.d.length > 0) {

        outerEdge = vertexFromListItem(data.d[0]);

        for(i=0;i<vertex.edges.length;i++) {
          e = vertex.edges[i];

          if(outerEdge.id == vertex.edges[i].Head) {
            e.Head = outerEdge;
            e.Tail = vertex;
            e.direction = 'out';
            break;
          } else if(outerEdge.id == vertex.edges[i].Tail) {
            e.Head = vertex;
            e.Tail = outerEdge;
            e.direction = 'in';
            break;
          }
        }

      } else {
        reject('Missing vertex by id.');
      }

    });

    resolve(vertex);
  });
}

function handleOrphanDocuments(data) {
  return new Promise(function(resolve, reject) {
    orphanDocuments = [];
    data.d.results.forEach((listItem)=>{
      orphanDocuments.push(documentFromListItem(listItem));
    });
    resolve(vertex);
  });
}

function handleDocuments(vertex, data) {
  return new Promise(function(resolve, reject) {
    vertex.documents = [];
    data.d.results.forEach((listItem)=>{
      vertex.documents.push(documentFromListItem(listItem));
    });
    resolve(vertex);
  });
}

function makeForceGraphData() {

  return new Promise(function(resolve, reject) {

    clearGraph();

    selected = nodeFromVertex(selectedNode)

    graph.nodes.push(selected);

    selectedNode.edges.forEach((edge) => {

      head = nodeFromVertex(edge.Head);
      tail = nodeFromVertex(edge.Tail);

      isDuplicateHead = _.some(graph.nodes, function(o) {
        return o.id === head.id;
      });

      if(!isDuplicateHead) {
        graph.nodes.push(head);
      }

      isDuplicateTail = _.some(graph.nodes, function(o) {
        return o.id === tail.id;
      });

      if(!isDuplicateTail) {
        graph.nodes.push(tail);
      }

      lnk = linkFromEdge(edge);

      graph.links.push(lnk);
    });

    graph.nodes = _.uniq(graph.nodes);

    resolve();
  });
}

function createVertexAndEdge() {

  node = {};
  node.Title = $('#node-title-input').val();
  node.Class = $('#node-class-input').val();
  node.Description = $('#node-description-input').val();

  return postListCreate(verticesURL, node).then(function(data) {

    edge = {};
    edge.Title = $('#node-predicate-input').val();

    isArrowDown = isModalPredicateArrowDown();

    if(isArrowDown) {
      edge.Head = selectedNode.id;
      edge.Tail = '' + data.d.Id;
    } else {
      edge.Head = '' + data.d.Id;
      edge.Tail = selectedNode.id;
    }
    return postListCreate(edgesURL, edge);
  }, function(error) {console.log(error);}).then(function(data) {

    clearModalAddNode();

    htmlModal = document.getElementById('modalAddNode');
    bsModal = bootstrap.Modal.getInstance(htmlModal);
    bsModal.hide();
    bsModal.dispose();

    updateUI();
  }, function(error) {console.log(error)});    

}

function nodeFromVertex(vertex) {

  node = {};
  node.class = 'node'; // the CSS class
  node.id = vertex.id;
  node.title = vertex.title;
  node.type = vertex.class; // the instance class

  return node;
}

function linkFromEdge(edge) {

  link = {};
  link.id = edge.Id;
  link.source = edge.Tail.id;
  link.target = edge.Head.id;
  link.class = 'link';
  link.type = edge.Tail.Class + '-' + edge.Head.Class;
  link.title = edge.Title;

  return link;
}
