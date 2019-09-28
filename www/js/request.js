
var requestsSent = 0;

/* Track requests and 
 *
 */
function trackRequest(url, onSuccess, onFailure, cache) {
  var key = "url-" + url;
  var cachedValue = getCookie(key);
  var loaded = false;
  if (cachedValue) {
    console.log("loaded " + key);
    var json = undefined;
    try {
      json = JSON.parse(cachedValue);
    } catch(e) {
      onSuccess(cachedValue);
    }
    if (json != undefined) {
      onSuccess(json);
      loaded = true;
    }
  } 
  if (!loaded) {
    sendRequest(url, function(json) {
      setCookie(key, JSON.stringify(json));
      console.log("stored " + key);
      onSuccess(json);
    }, onFailure);
    requestsSent++;
    console.log("request " + requestsSent + "\t" + url);
  }
}

/*
 * General function to request JSON.
 */
function sendRequest(url, onSuccess, onError, method, data){
  // see https://developer.mozilla.org/en-US/docs/Learn/HTML/Forms/Sending_forms_through_JavaScript
  var XHR = new XMLHttpRequest();
  if (!onError) {
    onError = function() {
      console.log("ERROR: " + url + " failed.");
    }
  }
  // Define what happens on successful data submission
  XHR.addEventListener('load', function(event) {
    if (event.target.status == 200) {
      if (onSuccess) {
        try {
          var json = JSON.parse(XHR.responseText);
        } catch (e) {
          onSuccess(XHR.responseText, event);
          return;
        }
        onSuccess(json, event);
      }
    } else {
      onError(event);
    }
  });

  // Define what happens in case of error
  XHR.addEventListener('error', function(event) {
    onError(event);
  });

  // Set up our request
  XHR.open(method || 'GET', url, true);
  // set header
  // see https://stackoverflow.com/a/24468752
  XHR.setRequestHeader("Content-Type", "application/json");
  XHR.send(data == undefined ? null : data);
}

