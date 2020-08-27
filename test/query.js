const cli = require("command-line-args");
const db = require("../src/module/query");
const search = require("../src/module/search");
const generateResponse = require("../src/module/response");

const optionDefinitions = [
    { name: 'source', alias: 's', type: String },
    { name: 'query', alias: 'q', type: String },
    { name: 'auth', alias: 'a', type: Boolean }
];

const options = cli(optionDefinitions);

if (!options.source || !options.query) {
  console.log(`syntax: ${process.argv[1]} --source <val> --query <query> [--auth]`);
  console.log("arg: auth used for acol queries to indicate an authorized user");
  process.exit(10);
}

db.initialize(true, "remote");

let request = {};

request.body = {
  source: options.source,
  query: options.query
}

if (options.auth) {
  request.body.authorization = "acol";
}

var result = {
  domain: "https://www.christmind.info",
  message: "OK"
};

var parms = search.parseRequest(request);
if (parms.error) {
  result.message = parms.message;
  console.log("%o",result);
  return result;
}

result.source = parms.source;
result.width = parms.width;
result.query = parms.query;
result.queryTransformed = parms.queryTransformed;

//present for restricted acol queries
if (typeof parms.restricted !== "undefined") {
  result.restricted = parms.restricted;
}

console.log("Your search request: %o", parms);
console.log("--------------------------------");

db.query(parms).then((resp) => {
  console.log(generateResponse(parms, resp, result));
}).catch((err) => {
  console.error(err);
});

