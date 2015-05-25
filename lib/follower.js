var DNS = require([__dirname, "dns"].join("/"));

module.exports = {

    initialize: function(core){
        var application_name = "service-discovery";
        core.logger.register(application_name);

        var cache = {
            applications: {}
        }

        var dns_server = new DNS(core);

        dns_server.listen(function(){
            core.cluster.legiond.join("applications.sync");
            core.cluster.legiond.on("applications.sync", function(applications){
                cache.applications = applications;
                dns_server.update(applications, function(){
                    core.loggers[application_name].log("verbose", "Updated DNS records!");
                    _.each(_.keys(applications), function(application){
                        core.loggers[application_name].log("debug", ["Updated DNS for ", application, "!"].join(""));
                    });
                });
            });
        });

        setInterval(function(){
            dns_server.update(cache.applications, function(){
                core.loggers[application_name].log("verbose", "Updated DNS records!");
            });
        }, 15000);
    }

}
