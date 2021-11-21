const cdk = require("@aws-cdk/core");
const { IAMRole } = require("./constructs/IAM-Roles-construct");

class LodgeIAMRoleStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.iamRole = new IAMRole(this, "IAMRole", {
      vpc: props.vpc,
      bucket: props.bucket,
    });
  }
}

module.exports = { LodgeIAMRoleStack };
