var async = require("async");
var DNS = require([__dirname, "dns"].join("/"));

module.exports = {

    initialize: function(core){
        var application_name = "service-discovery";
        core.logger.register(application_name);

        var dns_server = new DNS(core);

        dns_server.listen(function(){
            setInterval(function(){
                core.cluster.myriad.persistence.keys(core.constants.myriad.APPLICATIONS, function(err, application_names){
                    if(!err){
                        var applications = {};
                        async.each(application_names, function(application_name, fn){
                            core.cluster.myriad.persistence.get(application_name, function(err, application){
                                if(err)
                                    return fn();

                                try{
                                    application = JSON.parse(application);
                                }
                                catch(err){
                                    return fn();
                                }

                                applications[application.id] = application;
                                return fn();
                            });
                        }, function(err){
                            dns_server.update(applications, function(){
                                core.loggers[application_name].log("verbose", "Updated DNS records!");
                            });
                        });
                    }
                });
            }, 5000);
        });

    }

}
