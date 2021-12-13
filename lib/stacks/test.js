const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");

class LodgeVPCStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    const vpc = new ec2.Vpc(this, "VPC", {
      cidr: "10.0.0.0/16",
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: "public-subnet",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 26,
        },
        {
          name: "private-subnet",
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
          cidrMask: 20,
        },
      ],
      keyName: "kafkaTutorial",
    });
  }
}

module.exports = { LodgeVPCStack };
