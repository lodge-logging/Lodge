const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const { ZookeeperCluster } = require("./constructs/zookeeper-construct");
const { KafkaCluster } = require("./constructs/kafka-construct");

class RanaStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const zookeeperCluster = new ZookeeperCluster(this, "Zookeeper-cluster", {
      vpc: ec2.Vpc.fromLookup(this, "ZK_VPC", {
        isDefault: true,
      }),
      num: 3,
    });
    const kafkaCluster = new KafkaCluster(this, "Kafka-cluster", {
      vpc: ec2.Vpc.fromLookup(this, "K_VPC", {
        isDefault: true,
      }),
      num: 3,
    });
  }
}

module.exports = { RanaStack };
