const cdk = require("@aws-cdk/core");
const { Logstash } = require("./constructs/logstash-construct");
const ec2 = require("@aws-cdk/aws-ec2");

class JustinStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const logstash = new Logstash(this, "Logstash", {
      // vpc: ec2.Vpc.fromLookup(this, "test-vpc", {
      //   vpcId: "vpc-21b28859",
      //   // isDefault: true,
      // }),
      vpc: props.vpc,
      sshKey: props.sshKey,
      securityGroup: props.securityGroup,
      // updated
      kafkaInstances: props.kafkaInstances,
    });
  }
}

module.exports = { JustinStack };
