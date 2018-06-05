module.exports = function(RED) {
    var nforce = require('nforce');

    function ConnectionConfig(n) {
        var self = this;
        RED.nodes.createNode(this,n);
        this.subscriber = [];
        this.consumerKey = n.consumerKey;
        this.consumerSecret = n.consumerSecret;
        this.callbackUrl = n.callbackUrl;
        this.environment = n.environment;
        this.username = n.username;
        this.password = n.password;

        this.org = nforce.createConnection({
            clientId: n.consumerKey,
            clientSecret: n.consumerSecret,
            redirectUri: n.callbackUrl,
            environment: n.environment,
            mode: 'single',
            autoRefresh: true
        });

        this.subscribe = function(node, config){
            self.subscriber.push({
                "node": node,
                "config": config
            });
        }

        this.connecting = function(){
            self.subscriber.forEach(function(observer){
                if(observer){
                    observer.node.status({fill:"green",shape:"ring",text:"connecting...."});
                }
            });
        }

        this.failed = function(err){
            self.subscriber.forEach(function(observer){
                if(observer){
                    observer.node.status({fill:"red",shape:"dot",text:"Error!"});
                    observer.node.error(err);
                }
            });
        }

        this.connectionFinished = function(){
            self.subscriber.forEach(function(observer){
                if(observer.node.onConnectionFinished){
                    observer.node.onConnectionFinished();
                }
            });
        }

        this.connecting();
        this.org.authenticate({ username: n.username, password: n.password}, function(err, resp){
            if(err){
                self.failed(err);
            }
            self.connectionFinished();
        });
    }
    RED.nodes.registerType("connection-config",ConnectionConfig);
}
