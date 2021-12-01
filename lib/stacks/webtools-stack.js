const cdk = require("@aws-cdk/core");
const { WebTools } = require("../constructs/webTool-construct");
class LodgeWebToolsStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.webtools = new WebTools(this, "WebTools", {
      vpc: props.vpc,
      sshKey: props.sshKey,
      securityGroup: props.securityGroup,
      kafkaInstances: props.kafkaInstances,
      s3Role: props.s3Role,
      bucket: props.bucket,
      kibanaInstance: props.kibanaInstance,
      ESInstances: props.ESInstances,
    });
  }
}

module.exports = { LodgeWebToolsStack };
