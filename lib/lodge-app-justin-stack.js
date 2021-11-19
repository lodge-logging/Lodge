const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const { Logstash } = require("./constructs/logstash-construct");
const { VPC } = require('./constructs/vpc-construct');

class JustinStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // make sure to grab sshKey.

    const sshKey = 'lodge';
    const { vpc, securityGroups } = new VPC(this, 'VPC');
    
    const sshHost = new ec2.BastionHostLinux(this, 'ssh-host', {
      vpc,
      instanceName: 'ssh-host',
      securityGroup: securityGroups.sshSG,
    });

    const logstash = new Logstash(this, "Logstash", {
      sshKey, 
      vpc,
      securityGroup: securityGroups.logstashSG,
      // updated
      // kafkaInstances: props.kafkaInstances,
    });
  }
}

module.exports = { JustinStack };
