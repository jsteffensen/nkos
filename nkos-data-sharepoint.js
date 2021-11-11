var baseURL = 'https://sharepoint/sites/collaboration/fipt/gs';
var verticesURL = baseURL + '/_vti_bin/listdata.svc/NankosVertices';
var edgesURL = baseURL + '/_vti_bin/listdata.svc/NankosEdges';

$.ajaxSetup({ cache: false });

function getVerticesSearchResults(term) {

    filter = 'substringof(%27' + term + '%27,Tags)+or+substringof(%27' + term + '%27,Title)';
    expand = '&$expand=CreatedBy';
    orderBy = '&$orderby=Id%20desc';
    urlstring = verticesURL + '?$filter=' + filter + expand + orderBy;

    return getListResults(urlstring);
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
      error: function(jqxhr, status, exception) {
        console.log(status);
        console.log(exception);
        reject(exception);
      }
    });
  });
}