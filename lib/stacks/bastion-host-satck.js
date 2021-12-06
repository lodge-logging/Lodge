const cdk = require("@aws-cdk/core");
const { SSHHost } = require("../constructs/ssh-host-construct");

class LodgeBastionHostStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.sshHost = new SSHHost(this, "ssh-host", {
      vpc: props.vpc,
      sshKey: props.sshKey,
      securityGroup: props.securityGroup,
      ec2Role: props.ec2Role,
      ESInstances: props.ESInstances,
      kafkaInstances: props.kafkaInstances,
      zookeeperInstances: props.zookeeperInstances,
      kibanaInstance: props.kibanaInstance,
      webToolsInstance: props.webToolsInstance,
    });
  }
}

module.exports = { LodgeBastionHostStack };
