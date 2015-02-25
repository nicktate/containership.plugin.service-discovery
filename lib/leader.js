var _ = require("lodash");

module.exports = {

    initialize: function(core){
        var application_name = "containership-haproxy";

        core.logger.register("service-discovery");

        var add_application = function(){
            if(_.has(core.applications.list, application_name))
                core.loggers["service-discovery"].log("verbose", [application_name, "already exists, skipping create!"].join(" "));
            else{
                core.loggers["service-discovery"].log("verbose", ["Creating ", application_name, "!"].join(""));

                core.applications.add({
                    id: application_name,
                    image: "containership/haproxy:0.0.1",
                    cpus: 0.1,
                    memory: 128,
                    network_mode: "host",
                    tags: {
                        constraints: {
                            per_host: 1
                        }
                    }
                });
            }
        }

        if(core.cluster.praetor.is_controlling_leader())
            add_application();

        core.cluster.legiond.on("promoted", function(){
            if(_.isEmpty(core.applications.list))
                setTimeout(add_application, 2000);
            else
                add_application();
        });

    }

}
