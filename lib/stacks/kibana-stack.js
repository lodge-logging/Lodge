const cdk = require("@aws-cdk/core");
const { Kibana } = require("../constructs/kibana-construct");

class LodgeKibanaStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.kibana = new Kibana(this, "Kibana", {
      vpc: props.vpc,
      sshKey: props.sshKey,
      securityGroup: props.securityGroup,
      ESInstances: props.ESInstances,
    });
  }
}
module.exports = { LodgeKibanaStack };
