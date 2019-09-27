
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

var packageDB = {
  columnIndexOf : {
    // will be filled on load
  },
  packageFromId : function(packageId) {
    return routers.packages[parseInt(packageId)];
  }
}

window.addEventListener("load", function() {
  // fill the column names
  routers.column_names.forEach(function(element, index) {
    routerDB.columnIndexOf[element] = index;
  })
  packages.column_names.forEach(function(element, index) {
    packageDB.columnIndexOf[element] = index;
  })
  // sort the routers and give them ids
  routers.models.sort(compareModel)
  routers.models.forEach(function(model, index){
    model.id = "" + index;
  });
  // the packages are sorted. they receive an id
  packages.models.forEach(function(model, index){
    model.id = "" + index;
  });
});

