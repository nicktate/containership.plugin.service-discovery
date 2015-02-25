service-discovery
==================

##About

###Description
A service discovery plugin for Containership

###Author
ContainerShip Developers - developers@containership.io

##Usage

###Install
`containership plugin add service-discovery`

###Update
`containership plugin update service-discovery`

###Remove
`containership plugin remove service-discovery`

##Under the Hood
The ContainerShip controlling leader dynamically creates an application named `containership-haproxy` on the cluster, using the `containership/haproxy` image. The follower nodes automatically configure DNS records for all applications on the cluster, as well as hosts. Haproxy listens on each application's `discovery_port`, loadbalancing tcp connections to the backing containers for that application. To route to another application, you can simply make a request to `{app_name}.{process.env.CS_CLUSTER_ID}.containership:{CS_DISCOVERY_PORT_APP_NAME}`. More detailed information about the service-discovery plugin can be found in the [docs](http://containership.io/docs/discovery/).

##Contributing
Pull requests and issues are encouraged!
