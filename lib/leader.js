var _ = require("lodash");

module.exports = {

    initialize: function(core){
        var application_name = "service-discovery";

        core.logger.register(application_name);

        var add_application = function(){
            core.cluster.myriad.persistence.get([core.constants.myriad.APPLICATION_PREFIX, application_name].join(core.constants.myriad.DELIMITER), function(err){
                if(err){
                    core.loggers[application_name].log("verbose", ["Creating ", application_name, "!"].join(""));

                    core.applications.add({
                        id: application_name,
                        image: "containership/haproxy:0.0.1",
                        cpus: 0.1,
                        memory: 128,
                        network_mode: "host",
                        privileged: false,
                        tags: {
                            constraints: {
                                per_host: 1
                            },
                            metadata: {
                                plugin: application_name
                            }
                        }
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
