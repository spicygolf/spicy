var graph_module = require("@arangodb/general-graph");
var edgeDefinitions = [
  {
    collection: "edges",
    from: ["games", "gamespecs", "options", "players", "rounds"],
    to: ["games", "gamespecs", "options", "players", "rounds"],
  },
];

try {
  var graph = graph_module._create("games", edgeDefinitions);
  console.log("graph", graph);
} catch (error) {
  console.log(error.message);
}
