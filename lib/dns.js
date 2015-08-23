var _ = require("lodash");
var async = require("async");
var Quarry = require("quarry-dns");
var child_process = require("child_process");

function DNS(core){
    var self = this;

    this.core = core;
    this.core.dns = this;

    this.server = new Quarry({
        interface: "127.0.0.1",
        persistence: "memory",
        port: 53
    });

    setTimeout(function(){
        self.get_tld = function(){
            return [self.core.cluster_id, "containership"].join(".");
        }

        self.host_interface = "127.0.0.1";

        child_process.exec("ifconfig docker0 | grep 'inet addr' | awk -F: '{print $2}' | awk '{print $1}'", function(err, stdout, stderr){
            self.bridge_interface = _.trim(stdout);

            self.core.scheduler.follower.container.set_start_arguments("docker", "HostConfig.Dns", function(options){
                return JSON.stringify([self.bridge_interface]);
            });

            self.core.scheduler.follower.container.set_start_arguments("docker", "HostConfig.DnsSearch", JSON.stringify([self.get_tld()]))
        });
    }, 2000);
}

DNS.prototype.listen = function(fn){
    var self = this;

    this.server.listen(function(){
        return async.parallel({
            "8.8.8.8": function(fn){
                self.server.persistence.create_forwarder("8.8.8.8", { timeout: 5000, port: 53 }, fn);
            },

            "8.8.4.4": function(fn){
                self.server.persistence.create_forwarder("8.8.4.4", { timeout: 5000, port: 53 }, fn);
            }
        }, fn);
    });
}

DNS.prototype.update = function(applications, fn){
    var self = this;

    this.server.persistence.get_configuration(function(err, configuration){
        var hosts = self.core.cluster.legiond.get_peers();
        hosts.push(self.core.cluster.legiond.get_attributes());
        hosts = _.indexBy(hosts, "host_name");

        var dns_records = _.keys(configuration.records);
        var records = _.flatten([_.keys(applications), _.keys(hosts)]);

        var to_create = _.without(records, dns_records);
        var to_delete = _.without(dns_records, records);

        return async.parallel({
            create: function(fn){
                async.each(to_create, function(record, fn){
                    if(_.has(applications, record))
                        var address = self.bridge_interface;
                    else
                        var address = hosts[record].address.private;

                    self.server.persistence.update_record([record, self.get_tld()].join("."), { type: "A", address: address }, function(err){
                        if(err)
                            return self.server.persistence.create_record([record, self.get_tld()].join("."), { type: "A", address: address }, fn);
                        else
                            return fn();
                    });
                }, fn);
            },

            update_leaders: function(fn){
                var address = _.map(hosts, function(host, host_name){
                    if(host.mode == "leader")
                        return host.address.private;
                });
                self.server.persistence.update_record(["leaders", self.get_tld()].join("."), { type: "A", address: _.compact(address) }, function(err){
                    if(err)
                        return self.server.persistence.create_record(["leaders", self.get_tld()].join("."), { type: "A", address: _.compact(address) }, fn);
                    else
                        return fn();
                });
            },

            update_followers: function(fn){
                var address = _.map(hosts, function(host, host_name){
                    if(host.mode == "follower")
                        return host.address.private;
                });
                self.server.persistence.update_record(["followers", self.get_tld()].join("."), { type: "A", address: _.compact(address) }, function(err){
                    if(err)
                        return self.server.persistence.create_record(["followers", self.get_tld()].join("."), { type: "A", address: _.compact(address) }, fn);
                    else
                        return fn();
                });
            },

            delete: function(fn){
                async.each(to_delete, function(record, fn){
                    return self.server.persistence.delete_record([record, self.get_tld()].join("."), fn);
                }, fn);
            }
        }, fn);
    });
}

module.exports = DNS;
