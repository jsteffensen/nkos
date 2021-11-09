var userId, selectedNode, graph;

function clearData() {
  clearSelected();
  clearGraph();
}

function clearSelected() {
  selectedNode = {};
  selectedNode.id = 0;
}

function clearGraph() {
  graph = {};
  graph.nodes = [];
  graph.links = [];
}

function insertTestData() {

  return new Promise(function(resolve, reject) {
    clearData();

    selectedNode = {'title':'my node1', 'id':'1', 'class':'someType'};
    graph.nodes.push(selectedNode);
    graph.nodes.push({'title':'my node2', 'id':'2', 'class':'someOtherType'});

    graph.links.push({'source':'1', 'target':'2', 'predicate':'hasA'});

    resolve();
  });
  
}
