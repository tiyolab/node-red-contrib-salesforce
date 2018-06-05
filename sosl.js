module.exports = function(RED) {

  var nforce = require('nforce');

  function Query(config) {
    RED.nodes.createNode(this,config);
    
    this.connection = RED.nodes.getNode(config.connection);
    this.connection.subscribe(this, config);

    var node = this;
    this.on('input', function(msg) {

      // use msg query if node's query is blank
      if (msg.hasOwnProperty("query") && config.query === '') {
        config.query = msg.query;
      }

      // show initial status of progress
      node.status({fill:"green",shape:"ring",text:"processing...."});

      // auth and run query
      this.connection.org.search({ search: config.query })
      .then(function(results) {
        msg.payload = {
          size: results.length,
          records: results
        }
        msg.payload = results;
        node.send(msg);
        node.status({});
      }).error(function(err) {
        node.status({fill:"red",shape:"dot",text:"Error!"});
        node.error(err);
      });

    });
  }
  RED.nodes.registerType("sosl",Query);
}
