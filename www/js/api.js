/* Speak to the build API.
 *
 */

function getBuildConfig() {
  var model = getSelectedModelObject();
  var config = {
    "git-url": repositoryInput.value,
    "branch" : branchInput.value,
    "target" : modelTarget.value,
    "subtarget" : modelSubtarget.value,
    "model"  : model.model,
    "email"  : emailInput.value,
  };
  return config;
}

function startBuild() {
  console.log(getBuildConfig());
}

