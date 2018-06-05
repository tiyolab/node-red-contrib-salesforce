module.exports = function (RED) {

  var nforce = require('nforce');

  var nodes = {};

  function Streaming(config) {
    RED.nodes.createNode(this, config);
    this.connection = RED.nodes.getNode(config.connection);
    this.connection.subscribe(this, config);
    var node = this;

    node.disconnect = function(){
      debugger;
      if(nodes[node.id]){
        if (nodes[node.id].client) {
          if(nodes[node.id].client.disconnect){
            nodes[node.id].client.disconnect();
          }
        }
      }
    }

    node.onConnectionFinished = function () {
      if (config.isActive) {
        const opts = {};
        if (config.topicType === 'platform') {
          opts.isEvent = true;
        } else if (config.topicType === 'generic') {
          opts.isSystem = true;
        }
        opts.topic = config.pushTopic

        node.disconnect();
        
        node.client = node.connection.org.createStreamClient();
        var stream = node.client.subscribe(opts);
        nodes[node.id] = node;

        node.status({ fill: "green", shape: "ring", text: "subscribing to " + config.pushTopic });

        stream.on('error', function (err) {
          node.status({ fill: "red", shape: "ring", text: err.message });
          node.client.disconnect();
        });

        stream.on('data', function (data) {
          node.send({
            payload: data
          });
        });
      } else {
        node.disconnect();
        node.status({ fill: 'gray', shape: 'ring', text: 'idle' });
      }
    }

    if(node.connection.org.oauth){
      node.onConnectionFinished();
    }

  }
  RED.nodes.registerType("streaming", Streaming);
}
