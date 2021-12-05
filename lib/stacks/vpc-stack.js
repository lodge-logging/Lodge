const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const { VPC } = require("../constructs/vpc-construct");
const { SSHHost } = require("../constructs/ssh-host-construct");
const AWS = require("aws-sdk");

// AWS.config.update({region: 'REGION'});

const createSSHKey = () => {
  const KEY_NAME = "lodge-key";
  new AWS.EC2().createKeyPair(KEY_NAME, function (err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log(JSON.stringify(data));
    }
  });
  return KEY_NAME;
};

class LodgeVPCStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    this.sshKey = createSSHKey();

    const { vpc, securityGroups, ipsAndSubnets } = new VPC(this, "VPC", {
      existingVPC: props.existingVPC,
      userVPCId: props.userVPCId,
    });
    this.vpc = vpc;
    this.securityGroups = securityGroups;
    this.ipsAndSubnets = ipsAndSubnets;

    this.sshHost = new SSHHost(this, "ssh-host", {
      vpc,
      instanceName: "ssh-host",
      securityGroup: securityGroups.sshSG,
    });
  }
}

module.exports = { LodgeVPCStack };
