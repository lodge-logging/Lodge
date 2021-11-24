const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const { VPC } = require("../constructs/vpc-construct");

class LodgeVPCStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    const createSSHKey = () => "kafkaTutorial";
    this.sshKey = createSSHKey();

    const { vpc, securityGroups } = new VPC(this, "VPC");
    this.vpc = vpc;
    this.securityGroups = securityGroups;
    //const sharedProps = { vpc, sshKey };

    const sshHost = new ec2.BastionHostLinux(this, "ssh-host", {
      vpc,
      instanceName: "ssh-host",
      securityGroup: securityGroups.sshSG,
    });
  }
}

module.exports = { LodgeVPCStack };
