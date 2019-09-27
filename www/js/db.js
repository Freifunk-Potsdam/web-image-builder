
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
    var pack = packages.models[parseInt(packageId)];
    var result = {
      id: packageId
    };
    packages.column_names.forEach(function(name) {
      result[name] = pack[packageDB.columnIndexOf[name]];
    });
    // make the package more usable
    var url = result.sourcecode.match(/\[\[([^\|\]]*)/);
    result.sourcecodeurl = url ? url[1] : null
    result.description = result.description.replace(/\\\\\\\\/g, "\n").replace(/[ \n]*$/, "");
    result.kb = result.installedsize.match(/^[0-9]+$/) ? parseInt(result.installedsize) : null;
    return result;
  },
  findPackages: function(searchTerm) {
    // packages are sorted in this order
    // 1. number of terms in package name
    // 2. index of first found term in package name
    // 3. index found term in package name
    // 4. description matches
    var terms = searchTerm.toLowerCase().split(" ").filter(function(x){return x});
    var priority = {
      // id: {nameCount, nameFirstTerm, firstTermIndex, descriptionCount}
    };
    var maxPackageNameLength = 0;
    var maxDescriptionCount = 0;
    packages.models/*.slice(0, 10)*/.forEach(function(pack) {
      var packageName = pack[packageDB.columnIndexOf.name].toLowerCase();
      if (packageName.length > maxPackageNameLength) {
        maxPackageNameLength = packageName.length;
      }
      var packageDescription = pack[packageDB.columnIndexOf.description].toLowerCase();
      terms.forEach(function(term, index) {
        if (!priority[pack.id]) {
          priority[pack.id] = {nameCount: 0, nameFirstTerm: terms.length, firstTermIndex: 0, descriptionCount: 0};
        }
        var match = priority[pack.id];
        var nameIndex = packageName.indexOf(term);
        if (nameIndex != -1) {
          match.nameCount++;
          if (match.nameFirstTerm > index) {
            match.nameFirstTerm = index;
            match.firstTermIndex = nameIndex;
          }
        }
        match.descriptionCount += packageDescription.split(term).length - 1;
        if (maxDescriptionCount < match.descriptionCount) {
          maxDescriptionCount = match.descriptionCount;
        }
      });
    });
    var intPrio = {};
    packages.models.forEach(function(pack) {
      var prio = priority[pack.id];
      if (!prio) {
        intPrio[pack.id] = 0;
        return;
      }
      intPrio[pack.id] = 
        // nameCount, nameFirstTerm, firstTermIndex, descriptionCount
        prio.nameCount * (terms.length + 1) * maxPackageNameLength * maxDescriptionCount +
        (terms.length - prio.nameFirstTerm) * maxPackageNameLength * maxDescriptionCount +
        (maxPackageNameLength - 1 - prio.firstTermIndex)           * maxDescriptionCount +
        prio.descriptionCount
        ;
    });
//    console.log((terms.length + 1), maxPackageNameLength, maxDescriptionCount);
    var packs = packages.models.filter(function(pack){
      return intPrio[pack.id] != 0;
    });
    packs.sort(function(a, b){
      var val = Math.sign(intPrio[b.id] - intPrio[a.id]);
      if (val == 0) {
        val = caseInsensitiveComp(a[packageDB.columnIndexOf.name], b[packageDB.columnIndexOf.name]);
        if (val == 0) {
          return caseInsensitiveComp(a[packageDB.columnIndexOf.version], b[packageDB.columnIndexOf.version]);
        }
        return val;
      }
      return val;
    });
    return packs.map(function(pack, index){
//      if (index < 10) {
//        console.log(pack[packageDB.columnIndexOf.name], intPrio[pack.id], priority[pack.id]);
//      }
      return pack.id;
    });
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
  // sort the packages and give them ids
  packages.models.sort(function(a, b){
    return caseInsensitiveComp(
    a[packageDB.columnIndexOf.name],
    b[packageDB.columnIndexOf.name]);
  });
  packages.models.forEach(function(model, index){
    model.id = "" + index;
  });
});

