var baseURL = 'https://my/sharepoint/site';
var verticesURL = baseURL + '/_vti_bin/listdata.svc/NankosVertices';
var edgesURL = baseURL + '/_vti_bin/listdata.svc/NankosEdges';
var documentsURL = baseURL + '/_vti_bin/listdata.svc/NkosDocuments';

$.ajaxSetup({ cache: false });

function getVerticesSearchResults(term) {

    filter = 'substringof(%27' + term + '%27,Tags)+or+substringof(%27' + term + '%27,Title)';
    expand = '&$expand=CreatedBy';
    orderBy = '&$orderby=Id%20desc'; // always get latest version
    urlstring = verticesURL + '?$filter=' + filter + expand + orderBy;

    return getListResults(urlstring);
}

function getVersions(vertex) {

  //evaluate to false if:
  // null, undefined, NaN, empty string (''), 0, false
  if(vertex.SharedId) {
    filter = 'SharedId+eq+%27' + vertex.id + '%27';
    orderBy = '&$orderby=Id%20desc';
    urlstring = verticesURL + '?$filter=' + filter + orderBy;

    return getListResults(urlstring);
  } else {
    return Promise.resolve({d:{results:[]}}); // mock an empty result without actually making any requests
  }
}

function getEdges(vertex) {

  filter = 'Head+eq+%27' + vertex.id + '%27+or+Tail+eq+%27' + vertex.id + '%27';
  urlstring = edgesURL + '?$filter=' + filter;

  return getListResults(urlstring);
}

function getVertexById(id) {

    if(isNaN(id)) {

      filter = 'SharedId+eq+%27' + id + '%27';
      expand = '&$expand=CreatedBy';
      orderBy = '&$orderby=Id%20desc';
      limit = '&$top=1'
      urlstring = verticesURL + '?$filter=' + filter + expand + orderBy + limit;

      return getListResults(urlstring);

    } else {

      filter = 'Id+eq+' + parseInt(id);
      expand = '&$expand=CreatedBy';
      orderBy = '&$orderby=Id%20desc';
      limit = '&$top=1'
      urlstring = verticesURL + '?$filter=' + filter + expand + orderBy + limit;

      return getListResults(urlstring);
    }

}

function getOrphanDocuments(id) {

  filter = 'NodeId+eq+%27-%27';
  urlstring = documentsURL + '?$filter=' + filter;

  return getListResults(urlstring);
}

function getDocumentsByNodeId(id) {

  filter = 'NodeId+eq+%27' + id + '%27';
  urlstring = documentsURL + '?$filter=' + filter;

  return getListResults(urlstring);
}

function updateEdge(id, end, newNodeId) {
    
  urlstring = edgesURL + '(' + id + ')';
  data = {};

  if(end == 'head') {
    data.Head = newNodeId;    
  } else {
    data.Tail = newNodeId;    
  }

  return postListUpdate(urlstring, data);
}

function setPin(document, id) {
    
  urlstring = document.__metadata.uri;
  data = {'NodeId': id};

  return postListUpdate(urlstring, data);
}

function getListResults(urlstring) {
  return new Promise(function(resolve, reject) {

    $.ajax({
      url: urlstring,
      type: 'GET',
      dataType: 'json',
      success: function(data) {
        resolve(data);
      },
      error: function(xhr) {
        console.log(xhr);
        if(xhr.status == 403) {
          alert('Session expired. Page will reload.');
          location.reload();
        }
        reject(exception);
      }
    });
  });
}

function postListCreate(urlstring, data) {

  return new Promise(function(resolve, reject) {
    $.ajax({
      url: urlstring,
      type: 'POST',
      contentType: 'application/json;odata=verbose',
      data: JSON.stringify(data),
      headers: {
        'Accept': 'application/json;odata=verbose',
        'X-RequestDigest': $('#__REQUESTDIGEST').val()
      },
      success: function(data) {
        resolve(data);
      },
      error: function(jqxhr, status, exception) {
        console.log('ERROR: ' + status + ' - ' + exception);
        reject();
      }
    });
  });
}

function postListUpdate(urlstring, data) {
  return new Promise(function(resolve, reject) {

    $.ajax({
      url: urlstring,
      type: 'POST',
      contentType: 'application/json;odata=verbose',
      processData: false,
      data: JSON.stringify(data),
      headers:{
        'Accept':'application/json;odata=verbose',
        'X-RequestDigest':$('#__REQUESTDIGEST').val(),
        'X-HTTP-Method':'MERGE',
        'If-Match':'*'
      },
      success: function(data) {
        resolve(data);
      },
      error: function(jqxhr, status, exception) {
        console.log(status);
        console.log(exception);
        reject(exception);
      }
    });
  });
}

<!-- formatting ---------------------------------------------------------------------------- -->

function formatSharepointDate(datestring) {
  
  var a = new Date( Number(datestring.substring(6, 19)) );
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();

  var time = date + '-' + month + '-' + year;
  return time;

}

function formatSharepointDateTime(datestring) {
  
  var a = new Date( Number(datestring.substring(6, 19)) );
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes() < 10 ? '0' + a.getMinutes() : a.getMinutes();

  var time = date + '-' + month + '-' + year + ' ' + hour + ':' + min;
  return time;

}

function vertexFromListItem(listItem) {
  
  vertex = listItem;
  vertex.title = listItem.Title;

  if(listItem.SharedId) {
    vertex.id = listItem.SharedId;
  } else {
    vertex.id = '' + listItem.Id; // force id to string type
  }

  vertex.class = listItem.Class;
  vertex.documents = [];
  vertex.edges = [];
  vertex.versions = [];
  
  return vertex;
}

function edgeFromListItem(listItem) {
  
  edge = listItem;
  edge.title = listItem.Title;
  edge.id = listItem.Id;
  edge.head = listItem.Head;
  edge.tail = listItem.Tail;
  
  return edge;
}

function documentFromListItem(listItem) {
  
  doc = listItem;
  doc.title = listItem.Name;
  doc.id = listItem.Id;
  doc.description = listItem.Description;
  doc.date = listItem.Published || listItem.Created;
  doc.date = formatSharepointDate(doc.date);
  doc.nodeId = listItem.NodeId;
  
  return doc;
}
