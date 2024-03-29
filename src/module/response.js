var search = require("./search");
var teaching = require("./source");

function processQueryItem(source, result, book, info, authorized) {
  //we shouldn't get here if source is unrecognized but add a guard just in case
  if (typeof teaching[source] === "function") {
    teaching[source](result, book, info, authorized);
  }
}

function generateSearchResponse(parms, searchResults, result) {
  var filteredCount = 0;

  searchResults.forEach(function(val) {
    var info = {};

    // if not filtered process item
    // if (!search.filter(parms, val.text, parms.source === "pwom" ? "pl": "en")) {
    if (!search.filter(parms, val.text)) {
      filteredCount++;

      info.book = val.book;
      info.unit = val.unit;

      //val.pid is missing from text in p0, this is due to importing
      //using dynobase
      if (typeof val.pid === "undefined") {
        info.location = "p0";
      }
      else {
        info.location = "p" + val.pid;
      }

      // true for source "oe" - ACIM OE
      if (typeof val.ref !== "undefined") {
        info.ref = val.ref;
      }
      else {
        //this helps to generalize formatting search results. All sources use
        //info.ref to display match location (4/24/23)
        info.ref = val.pid;
      }

      info.key = val.parakey;

      info.context = search.getContext(parms.queryTransformed, parms.query, val.text, parms.width);
      processQueryItem(parms.source, result, val.book, info, parms.authorized);
    }
  });

  result.count = filteredCount;
  search.sortResults(result);
  return result;
}

module.exports = generateSearchResponse;

