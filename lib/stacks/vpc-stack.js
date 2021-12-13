const cdk = require("@aws-cdk/core");
const { VPC } = require("../constructs/vpc-construct");

class LodgeVPCStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    this.sshKey = "lodge-key";

    this.vpcStack = new VPC(this, "VPC", {
      existingVPC: props.existingVPC,
      userVPCId: props.userVPCId,
    });
  }
}

module.exports = { LodgeVPCStack };
