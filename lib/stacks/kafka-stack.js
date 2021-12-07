const cdk = require("@aws-cdk/core");
const { KafkaCluster } = require("../constructs/kafka-construct");

class LodgeKafkaStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.kafkaCluster = new KafkaCluster(this, "Kafka-cluster", {
      vpc: props.vpc,
      sshKey: props.sshKey,
      num: 3,
      securityGroup: props.securityGroup,
      zookeeperInstances: props.zookeeperInstances,
      PrivateSubnets: props.PrivateSubnets,
    });
  }
}

module.exports = { LodgeKafkaStack };
