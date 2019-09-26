
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
      console.log("error: " + e);
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
function sendRequest(url, onSuccess, onError){
  // see https://developer.mozilla.org/en-US/docs/Learn/HTML/Forms/Sending_forms_through_JavaScript
  var XHR = new XMLHttpRequest();
  if (!onError) {
    onError = function() {
      log.log("ERROR: " + url + " failed.");
    }
  }
  // Define what happens on successful data submission
  XHR.addEventListener('load', function(event) {
    if (event.target.status == 200) {
      if (onSuccess) {
        try {
          var json = JSON.parse(XHR.responseText);
        } catch (e) {
          onError(event, e);
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
  XHR.open('GET', url, true);
  XHR.send(null);
}

