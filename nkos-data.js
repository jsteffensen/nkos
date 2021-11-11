var userId, selectedNode, graph;

function clearData() {
  clearSelected();
  clearGraph();
}

function clearSelected() {
  selectedNode = {};
  selectedNode.id = 0;
  selectedNode.documents = [];
}

function clearGraph() {
  graph = {};
  graph.nodes = [];
  graph.links = [];
}

function insertTestData() {

  return new Promise(function(resolve, reject) {
    clearData();

    selectedNode = {'title':'my node1', 'id':'1', 'class':'someType', 'documents':[]};
    selectedNode.documents.push({'id':'1', 'title':'my document 1', 'description':'Some placeholder in a paragraph below the heading and date', 'date':'10-Nov-2021'});
    selectedNode.documents.push({'id':'2', 'title':'my document 2', 'description':'Some placeholder in a paragraph below the heading and date', 'date':'08-Nov-2021'});

    graph.nodes.push(selectedNode);
    graph.nodes.push({'title':'my node2', 'id':'2', 'class':'someOtherType'});
    graph.nodes.push({'title':'my node3', 'id':'3', 'class':'someThirdType'});

    graph.links.push({'id': '1', 'source':'1', 'target':'2', 'title':'hasA'});
    graph.links.push({'id': '2', 'source':'3', 'target':'1', 'title':'uses'});

    resolve();
  });
  
}

function insertTestData2() {

  return new Promise(function(resolve, reject) {

    selectedNode = {'title':'my node2', 'id':'2', 'class':'someOtherType'};

    graph.nodes.push({'title':'my node4', 'id':'4', 'class':'fourthType'});
    graph.links.push({'source':'4', 'target':'2', 'title':'usedToBe'});

    resolve();
  });
  
}
