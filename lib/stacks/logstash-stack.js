const cdk = require("@aws-cdk/core");
const { Logstash } = require("../constructs/logstash-construct");
class LodgeLogstashStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.logstash = new Logstash(this, "Logstash", {
      vpc: props.vpc,
      sshKey: props.sshKey,
      securityGroup: props.securityGroup,
      kafkaInstances: props.kafkaInstances,
      bucket: props.bucket,
      ESInstances: props.ESInstances,
      s3Role: props.s3Role,
      PrivateSubnets: props.PrivateSubnets,
    });
  }
}

module.exports = { LodgeLogstashStack };
