var DNS = require([__dirname, "dns"].join("/"));

module.exports = {

    initialize: function(core){
        core.logger.register("service-discovery");

        var dns_server = new DNS(core);
        dns_server.listen(function(){
            core.cluster.legiond.join("applications.sync");
            core.cluster.legiond.on("applications.sync", function(applications){
                dns_server.update(applications, function(){
                    core.loggers["service-discovery"].log("verbose", "Updated DNS records!");
                    _.each(_.keys(applications), function(application){
                        core.loggers["service-discovery"].log("debug", ["Updated DNS for ", application, "!"].join(""));
                    });
                });
            });
        });
    }

}
