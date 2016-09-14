var _ = require("lodash");

module.exports = {

    initialize: function(core){
        var application_name = "service-discovery";

        core.logger.register(application_name);

        var add_application = function(){
            core.cluster.myriad.persistence.get([core.constants.myriad.APPLICATION_PREFIX, application_name].join(core.constants.myriad.DELIMITER), function(err){
                if(err){
                    core.applications.add({
                        id: application_name,
                        image: "containership/service-discovery:latest",
                        cpus: 0.1,
                        memory: 64,
                        network_mode: "host",
                        privileged: false,
                        env_vars: {},
                        tags: {
                            constraints: {
                                per_host: 1
                            },
                            metadata: {
                                ancestry: "containership.plugin",
                                plugin: application_name
                            }
                        }
                    }, function(){
                        core.loggers[application_name].log("verbose", ["Created ", application_name, "!"].join(""));
                    });
                }
                else
                    core.loggers[application_name].log("verbose", [application_name, "already exists, skipping create!"].join(" "));
            });
        }

        if(core.cluster.praetor.is_controlling_leader())
            add_application();

        core.cluster.legiond.on("promoted", function(){
            core.cluster.myriad.persistence.keys(core.constants.myriad.APPLICATIONS, function(err, applications){
                if(err || !_.isEmpty(applications))
                    add_application();
                else
                    setTimeout(add_application, 2000);
            });
        });

    }

}
