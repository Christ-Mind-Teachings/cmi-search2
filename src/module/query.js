/*eslint no-console: "warn"*/
var AWS = require("aws-sdk");

let dbInitialized = false;
let db;

function initialize(dev = false, endpoint = "local") {

  // --------- DEVELOPMENT ONLY ------------------
  if (dev) {
    var local = "http://localhost:8000";
    var remote = "https://dynamodb.us-east-1.amazonaws.com";

    var awsConfig = {
      region: "us-east-1"
    };

    if (endpoint === "remote") {
      awsConfig.endpoint = remote;
    }
    else {
      awsConfig.endpoint = local;
    }

    AWS.config.update(awsConfig);
  }
  // --------- DEVELOPMENT ONLY ------------------

  if (!dbInitialized) {
    db = new AWS.DynamoDB.DocumentClient();
    dbInitialized = true;
  }
}

function query(options) {
  return new Promise((resolve, reject) => {

    var parms = {
      "TableName": "cmiSearch",
      "KeyConditionExpression": "#DYNOBASE_source = :pkey",
      "ExpressionAttributeValues": {
        ":pkey": `${options.source}`,
        ":text": `${options.queryTransformed}`
      },
      "ExpressionAttributeNames": {
        "#DYNOBASE_source": "source",
        "#DYNOBASE_text": "text"
      },
      "ScanIndexForward": true,
      "FilterExpression": "contains(#DYNOBASE_text, :text)"
    };

    let searchResults = [];

    function cb(err, data) {
      if (err) {
        reject(err);
        return;
      }
      else if (data.LastEvaluatedKey) {
        parms.ExclusiveStartKey = data.LastEvaluatedKey;
        db.query(parms, cb);
      }
      else {
        resolve(searchResults);
      }
      searchResults.push(...data.Items);
    }

    db.query(parms, cb);
  });
}

module.exports = {
  query: query,
  initialize: initialize
};

