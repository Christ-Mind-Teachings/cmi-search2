/*eslint no-console: "warn"*/

var ApiBuilder = require("claudia-api-builder");
var api = new ApiBuilder();

module.exports = api;

api.post("/request", function(request) {
  return request;
});

api.post("/search", function (request) {
  var search = require("./module/search");
  var db = require("./module/query");
  var generateResponse = require("./module/response");

  var result = {
    domain: "https://www.christmind.info",
    message: "OK"
  };

  var parms = search.parseRequest(request);
  if (parms.error) {
    result.message = parms.message;
    return result;
  }

  db.initialize(false);

  result.source = parms.source;
  result.width = parms.width;
  result.query = parms.query;
  result.strict = parms.strict;
  result.queryTransformed = parms.queryTransformed;

  //present for restricted acol queries
  if (typeof parms.restricted !== "undefined") {
    result.restricted = parms.restricted;
  }

  return db.query(parms)
    .then((resp) => {
      return generateResponse(parms, resp, result);
    })
    .catch((err) => {
      result.error = err;
      return result;
    });
});

