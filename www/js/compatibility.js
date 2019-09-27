function removeElementFromArray(arr, item) {
  // from https://stackoverflow.com/a/18165553
  for (var i = arr.length; i--;) {
    if (arr[i] === item) {
      arr.splice(i, 1);
    }
  }
}
