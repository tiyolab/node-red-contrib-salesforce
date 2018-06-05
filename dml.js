module.exports = function(RED) {

  var nforce = require('nforce');
  var _ = require('lodash');

  function Dml(config) {
    RED.nodes.createNode(this,config);
    this.connection = RED.nodes.getNode(config.connection);
    this.connection.subscribe(this, config);
    var node = this;
    this.on('input', function(msg) {

      // check for overriding message properties
      if (msg.hasOwnProperty("action") && config.action === '') {
        config.action = msg.action;
      }
      if (msg.hasOwnProperty("object") && config.object === '') {
        config.object = msg.object;
      }

      // show initial status of progress
      node.status({fill:"green",shape:"ring",text:"processing...."});

      

      // auth and run query
      (function(){
        var obj = nforce.createSObject(config.object, msg.payload);
        if (config.action === 'insert') {
          return node.connection.org.insert({ sobject: obj });

        } else if (config.action === 'update') {
          return node.connection.org.update({ sobject: obj });

        } else if (config.action === 'upsert') {
          // check for a field specified for external id
          if (msg.hasOwnProperty("externalId")) {
            obj.setExternalId(msg.externalId.field, msg.externalId.value);
          }
          return node.connection.org.upsert({ sobject: obj });

        } else {
          return node.connection.org.delete({ sobject: obj })
        }

      }).then(function(results) {

        // cteate a default payload to populate
        msg.payload = {
          success: true,
          object: config.object.toLowerCase()
        }

        if (config.action === 'insert') {
          _.extend(msg.payload, {id: results.id, 'action': 'insert'});
        } else if (config.action === 'update') {
          _.extend(msg.payload, {id: msg.payload.id, 'action': 'update'});
        } else if (config.action === 'upsert') {
          if (results.id != null) {
            _.extend(msg.payload, {id: results.id, 'action': 'insert'});
          } else {
            _.extend(msg.payload, {id: msg.externalId, 'action': 'update'});
          }
        } else {
          _.extend(msg.payload, {id: msg.payload.id, 'action': 'delete'});
        }

        node.send(msg);
        node.status({});
      }).error(function(err) {
        node.status({fill:"red",shape:"dot",text:"Error!"});
        node.error(err);
      });

    });
  }
  RED.nodes.registerType("dml",Dml);
}
