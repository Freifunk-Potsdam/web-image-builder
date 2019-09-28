/* Speak to the build API.
 *
 */

function getBuildConfig() {
  var model = getSelectedModelObject();
  var config = {
    "git-url"   : repositoryInput.value,
    "branch"    : branchInput.value,
    "target"    : modelTarget.value + "-" + modelSubtarget.value,
    "email"     : contactInput.value,
    "packages"  : getPackageFileName(),
    "files" : [
      {
        "path": "/packages/" + getPackageFile(),
        "append" : getPackageFileContent(),
      },
      {
        "path": "/configs/" + getConfigFileName(),
        "content" : getConfigFileContent(),
      },
      {
        "path": "/profiles/" + getProfileFileName(),
        "content" : modelProfile.value,
      },
    ],
  };
  return config;
}

function startBuild() {
  var url = getServerUrl();
  var config = getBuildConfig();
  sendRequest(url + "/build", function(json) {
    console.log(json);
  }, function(error) {
    alert("Konnte nicht mit dem Server reden: " + error);
  }, "POST", JSON.stringify(config));
}

