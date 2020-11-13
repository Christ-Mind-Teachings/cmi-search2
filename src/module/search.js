/*eslint no-console: "warn"*/

function sortResults(result) {
  var key;

  for (key in result) {
    if (Array.isArray(result[key])) {
      result[key].sort(function(a,b) {
        return a.key - b.key;
      });
    }
  }
}

/*
 * filter result set
 *
 * Default filter: all matches must start at word boundary, filter all the rest
 */
function filter(request, text, lang = "en") {
  var pos;
  var result = false;

  //don't filter result set if 'filter' passed to request
  if (request.filter) {
    result = false;
  }
  else {
    //default filter: query term must start at a word boundary
    pos = text.indexOf(request.queryTransformed);

    if (pos === -1) {
      //this should never happen
      result = "Yikes!! filter(): query string not found in text";
    }
    else if (pos > 0) {
      let result;
      switch (lang) {
        //look for whitespace one char before the match, return false is found
        case "pl":
          result = /\s/.test(text.charAt(pos-1));
          return !result;
        default:
          return /\w/.test(text.charAt(pos-1));
      }
    }
  }

  return result;
}

//lowercase and remove punction from query string
function prepareQueryString(query, lang) {
  let result = query.toLowerCase();

  //remove leading and trailing whitespace
  result = result.trim();

  //replace two or more whitespaces with one space
  result = result.replace(/[\s]{2,}/g," ");

  //remove non alpha characters
  switch (lang) {
    case "pl":
      return result.replace(/[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s]/g, "");
    default:
      return result.replace(/[^\w\s]/g, "");
  }
}

function parseRequest(request, lang="en") {
  var parms = {message: []};

  //if no parms given set error indicator and return
  if (request.body === null || typeof request.body === "undefined") {
    parms.message.push("request body missing");
    parms.error = true;
    return parms;
  }

  var userRequest = request.body;

  if (!userRequest.source) {
    parms.message.push("Error: body.source not specified");
  }
  else {
    parms.source = userRequest.source;

    if (parms.source === "pwom") {
      lang = "pl";
    }
  }

  if (!userRequest.query) {
    parms.message.push("Error: body.query not specified");
  }
  else {
    parms.query = userRequest.query;
  }

  //used by ACOL searches to filter out restricted content for unauthorized searchers
  parms.authorized = false;
  if (userRequest.authorization && userRequest.authorization === "acol") {
    parms.authorized = true;
  }
  else {
    parms.restricted = 0;
  }

  if (userRequest.startKey) {
    parms.startKey = userRequest.startKey;
  }

  //width defaults to 30
  var width = 30;
  if (typeof userRequest.width !== "undefined") {
    width = Number.parseInt(userRequest.width, 10);
    if (Number.isNaN(width) || width < 0) {
      width = 30;
    }
  }
  parms.width = width;

  if (parms.message.length > 0) {
    parms.error = true;
  }
  else {
    parms.queryTransformed = prepareQueryString(parms.query, lang);
    parms.error = false;
  }

  return parms;
}

/*
 * args: qt: query string transformed to remove punctuation and upper case chars
 *       query: original query string
 *       text: text containing the query
 *       width: width of context to return
 *         - length is: <width>query<width>
 *
 *  Return query hit in context of surrounding text
 */
function getContext(qt, query, text, width) {
  var contextSize = width;
  var start, end;
  var startPos = text.indexOf(qt);
  var endPos = startPos + qt.length;
  var context;

  //this "cannot be" but test for it anyway
  if (startPos === -1) {
    return text;
  }

  //don't trim the matched text when contextSize == 0
  if (contextSize === 0) {
    start = 0;
    end = text.length;
  }
  else {
    start = startPos - contextSize;
    if (start < 0) {
      start = 0;
    }

    end = endPos + contextSize;
    if (end > text.length) {
      end = text.length;
    }

    //if query is at the end of 'text' add more context to beginning
    if (endPos === text.length) {
      start = start - contextSize;
      if (start < 0) {
        start = 0;
      }
    }

    //decrease 'start' so we don't return partial words at the beginning of match
    while (start > 0 && text.charAt(start) !== " ") {
      start--;
    }

    //increase 'end' so we don't return partial words at the end of match
    while(end < text.length - 1 && text.charAt(end) !== " ") {
      end++;
    }
  }

  context = text.substr(start, end - start);

  //delimit query within the string
  return context.replace(qt, "<em>"+query+"</em>");
}

module.exports = {
  parseRequest: parseRequest,
  filter: filter,
  sortResults: sortResults,
  prepareQueryString: prepareQueryString,
  getContext: getContext
};

