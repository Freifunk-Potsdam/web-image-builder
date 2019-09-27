
//////////////////// Constants ////////////////////

var ALL_MODELS = "Alle Hersteller";
var ROOT_FIRMWARE_REPO = "https://api.github.com/repos/freifunk-berlin/firmware/forks?sort=stargazers&page=";
var BUILD_SERVER_LIST = [
  // no / at the end!
  "http://localhost:5000",
  "http://freifunk-build-server.quelltext.eu"
];
var MAXIMUM_NUMBER_OF_PACKAGES = 10;

//////////////////// Helper ////////////////////

function addOptionWithTextTo(text, select, id) {
  var option = document.createElement("option");
  option.text = text;
  option.id = option.value = id == undefined ? text : id;
  select.add(option);
  return option;
}

window.addEventListener("load", function() {
  fillRouterDropdowns();
  fillFirmwareDropdown();
  fillServer();
  onLoadSearchPackages();
});

//////////////////// Router and Model ////////////////////

// update

function fillRouterDropdowns() {
  var manifacturers = routerDB.getManifacturers();
  addOptionWithTextTo(ALL_MODELS, brandSelection);
  manifacturers.forEach(function(brand) {
    addOptionWithTextTo(brand, brandSelection);
  });
  updateModelSelection();
}

function updateModelSelection() {
  var selectedModel = getSelectedModel();
  var modelChanged = true;
  modelSelection.innerHTML = "";
  getSelectedBrand().getModels().forEach(function(model, index) {
    var name = model[routerDB.columnIndexOf.model];
    addOptionWithTextTo(name, modelSelection, model.id);
    if (model == selectedModel) {
      modelSelection.selectedIndex = index;
      modelChanged = false;
    }
  });
  if (modelChanged) {
    modelSelectionChanged();
  }
}

function updateModelInfo() {
  var model = getSelectedModelObject();
  modelTarget.value = model.target;
  modelSubtarget.value = model.subtarget;
  modelrammb.innerText = "RAM: " + model.rammb + "mb";
  modelflashmb.innerText = "Speicher: " + model.flashmb + "mb";
  var info = "";
  if (model.rammb && model.rammb <= 32 || model.flashmb && model.flashmb < 4) {
    info = "Dieses Modell hat wenig Speicher und ist ab OpenWRT 19.04 eventuell schlecht nutzbar.";
    modelinfo.className = "bad-news";
  } else {
    modelinfo.className = "";
  }
  modelinfo.innerText = info;
}

// get

function getSelectedBrand() {
  var options = brandSelection.selectedOptions;
  if (options.length == 0 || options[0].text == ALL_MODELS) {
    return {
      all: true,
      name: ALL_MODELS,
      getModels: function() {
        return routers.models;
      }
    }
  } else {
    var brand = options[0].text;
    return {
      all: true,
      name: brand,
      getModels: function() {
        return routers.models.filter(function(model) {
          return model[routerDB.columnIndexOf.brand] == brand;
        });
      }
    }
  }
}

function getSelectedModel() {
  var models = modelSelection.selectedOptions;
  if (models.length == 0) {
    return {
      id: null,
      reason: "no model was selected"
    };
  }
  return routerDB.modelFromId(models[0].id);
}

function getSelectedModelObject() {
  var selected = getSelectedModel();
  var model = {};
  routers.column_names.forEach(function(name, index) {
    model[name] = selected[index].match(/^[0-9]+$/) ? 
        parseInt(selected[index]) : 
        selected[index];
  });
  return model;
}

// on change

function brandSelectionChanged() {
  updateModelSelection();
}

function modelSelectionChanged() {
  updateModelInfo();
}

//////////////////// Repository ////////////////////

// on change

function repositorySelectionChanged() {
  updateBranchSelection();
  repositoryInput.value = "https://github.com/" + getSelectedRepository() + ".git";
}

function branchSelectionChanged() {
  branchInput.value = getSelectedBranch();
}

// update

function fillFirmwareDropdown() {
  var selectedRepository = getSelectedRepository();
  function loadRepoData(json) {
    if (json.length == 0) {
      return;
    }
    page++;
    trackRequest(ROOT_FIRMWARE_REPO + page, loadRepoData, onError);
    json.forEach(function(repo) {
      addOptionWithTextTo(repo.full_name, repository);
    });
    if (selectedRepository != getSelectedRepository()) {
      repositorySelectionChanged();
      selectedRepository = getSelectedRepository();
    }
  }
  function onError(error){
    alert("Could not load repository.")
  }
  var page = 1;
  trackRequest(ROOT_FIRMWARE_REPO + page, loadRepoData, onError);
  repositorySelectionChanged();
}

function updateBranchSelection() {
  branch.innerHTML = "";
  // https://developer.github.com/v3/repos/branches/#list-branches
  var branches = "https://api.github.com/repos/" + getSelectedRepository() + "/branches";
  var tags = "https://api.github.com/repos/" + getSelectedRepository() + "/tags";
  var selectedBranch = getSelectedBranch();
  branch.innerHTML = "";
  function onSuccess(json) {
    json.forEach(function(branch_) {
      addOptionWithTextTo(branch_.name, branch);
    });
    if (selectedBranch != getSelectedBranch()) {
      branchSelectionChanged();
      selectedBranch = getSelectedBranch();
    }
  };
  function onError() {
    alert("Could not load branches of " + getSelectedRepository());
  }
  trackRequest(tags, function(json){
    onSuccess(json);
    trackRequest(branches, onSuccess, onError);
  }, function(json){
    onError(json);
    trackRequest(branches, onSuccess, onError);
  });
}

// get

function getSelectedRepository() {
  return repository.selectedOptions[0].value;
}

function getSelectedBranch() {
  var selection = branch.selectedOptions;
  if (selection.length == 0) {
    return "master";
  }
  return selection[0].value;
}

//////////////////// Build Server ////////////////////

// update

function fillServer() {
  var seletedIndex = BUILD_SERVER_LIST.length;
  BUILD_SERVER_LIST.forEach(function(server, index) {
    sendRequest(server + "/status.json", function(status) {
      var text = status["tasks-ahead"] == 0 ? "frei" : status["tasks-ahead"] + " Aufgabe" + (status["tasks-ahead"] == 1 ? "n" : "");
      var option = addOptionWithTextTo(server + " - " + text, serverSelection, server);
      if (seletedIndex > index) {
        option.selected = true;
        seletedIndex = index;
        serverUrl.value = server;
        serverUrlChanged();
      }
    });
  });
}

// on change

function serverUrlChanged() {
  
}

//////////////////// Packages ////////////////////

// update

function onLoadSearchPackages() {
  updatePackagesList(packagesYInput, packagesY, packagePreviewY);
}

// on change

function updatePackagesList(input, packages, preview) {
  var result = packageDB.findPackages(input.value);
  preview.innerHTML = "";
  var updateLastPackage = function(pack) {
    return false;
  };
  var first = true;
  result.slice(0, MAXIMUM_NUMBER_OF_PACKAGES).forEach(function(packageId, index) {
    var pack = packageDB.packageFromId(packageId);
    if (updateLastPackage(pack)) {
      return;
    }
    // root element
    var root = document.createElement("li");
    if (first) {
      root.className = "first";
      first = false;
    }
    preview.appendChild(root);
    
    // title
    var name = document.createElement("a");
    name.className = "name";
    name.innerText = pack.name;
    name.onclick = function() {
      addPackageTo(pack, packages, preview);
    }
    root.appendChild(name);
    root.appendChild(document.createTextNode(" - "));
    
    // versions
    var versions = document.createElement("span");
    versions.className = "versions";
    root.appendChild(versions);
    
    // version
    var firstVersion = true;
    function addVersion(pack) {
      if (!firstVersion) {
        versions.appendChild(document.createTextNode(", "));
      }
      var version = document.createElement("a");
      version.className = "version";
      version.innerText = pack.version;
      if (pack.sourcecodeurl) {
        version.href = pack.sourcecodeurl;
      }
      versions.appendChild(version);
      firstVersion = false;
    }
    addVersion(pack);
    root.appendChild(document.createTextNode(" "));
    
    // description link
    var descriptionLink = document.createElement("a");
    descriptionLink.className = "descriptionLink";
    descriptionLink.innerText = "?";
    descriptionLink.onclick = function() {
      description.innerText = description.innerText ? "" : pack.description;
    }
    root.appendChild(descriptionLink);
    
    // desctiption
    var description = document.createElement("div");
    description.className = "description";
    root.appendChild(description);
    
    // next package
    updateLastPackage = function(newPack) {
      if (newPack.name == pack.name) {
        addVersion(newPack);
        return true;
      }
      return false;
    }
  });
}

function addPackageFrom(input, packages, preview) {
  var packageIds = packageDB.findPackages(input.value);
  if (packageIds) {
    var pack = packageDB.packageFromId(packageIds[0]);
    addPackageTo(pack, packages, preview);
  }
}

function addPackageTo(pack, packages, preview) {
  console.log(pack);
}

