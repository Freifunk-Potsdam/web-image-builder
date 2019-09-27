/* Speak to the build API.
 *
 */

function getBuildConfig() {
  var model = getSelectedModelObject();
  var config = {
    "git-url"   : repositoryInput.value,
    "branch"    : branchInput.value,
    "target"    : modelTarget.value,
    "subtarget" : modelSubtarget.value,
    "email"     : emailInput.value,
    "files" : [
      {
        "path": "/packages/" + getPackageFile(),
        "append" : getPackageFileContent(),
      },
      {
        "path": "/config/" + getConfigFileName(),
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
  console.log(getBuildConfig());
}

