
function caseInsensitiveComp(strA, strB) {
  // from https://stackoverflow.com/a/5286047
  return strA.toLowerCase().localeCompare(strB.toLowerCase());
}

function compareModel(a, b) {
  return caseInsensitiveComp(
    a[routerDB.columnIndexOf.model],
    b[routerDB.columnIndexOf.model]);
}

var routerDB = {
  getManifacturers : function() {
    var result = new Set();
    routers.models.forEach(function(model){ 
      result.add(model[routerDB.columnIndexOf.brand]);
    });
    result = Array.from(result);
    return result.sort(caseInsensitiveComp);
  },
  columnIndexOf : {
    // will be filled on load
  },
  modelFromId : function(modelId) {
    return routers.models[parseInt(modelId)];
  }
}

window.addEventListener("load", function() {
  // fill the column names
  routers.column_names.forEach(function(element, index) {
    routerDB.columnIndexOf[element] = index;
  })
  // sort the routers and give them ids
  routers.models.sort(compareModel)
  routers.models.forEach(function(model, index){
    model.id = "" + index;
  });
});

