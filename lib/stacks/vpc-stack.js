const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const { VPC } = require("../constructs/vpc-construct");
// AWS.config.update({region: 'REGION'});

class LodgeVPCStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    this.sshKey = "lodge-key";
    // const { vpc, securityGroups, ipsAndSubnets } = new VPC(this, "VPC", {
    //   existingVPC: props.existingVPC,
    //   userVPCId: props.userVPCId,
    // });
    // this.vpc = vpc;
    // this.securityGroups = securityGroups;
    // this.ipsAndSubnets = ipsAndSubnets;

    this.vpcStack = new VPC(this, "VPC", {
      existingVPC: props.existingVPC,
      userVPCId: props.userVPCId,
    });
    // this.vpc = vpc;
    // this.securityGroups = securityGroups;
    // this.ipsAndSubnets = ipsAndSubnets;

    // this.sshHost = new SSHHost(this, "ssh-host", {
    //   vpc,
    //   instanceName: "ssh-host",
    //   securityGroup: securityGroups.sshSG,
    // });
  }
}

module.exports = { LodgeVPCStack };
