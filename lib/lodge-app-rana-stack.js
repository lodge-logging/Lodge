const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const { ZookeeperCluster } = require("./constructs/zookeeper-construct");
const { KafkaCluster } = require("./constructs/kafka-construct");
const data = require("../ranaStack.json");

class RanaStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // The code that defines your stack goes here
    this.zookeeperCluster = new ZookeeperCluster(this, "Zookeeper-cluster", {
      vpc: ec2.Vpc.fromLookup(this, "ZK_VPC", {
        vpcId: "vpc-21b28859",
      }),
      num: 3,
    });
    const kafkaCluster = new KafkaCluster(this, "Kafka-cluster", {
      vpc: ec2.Vpc.fromLookup(this, "K_VPC", {
        vpcId: "vpc-21b28859",
        //isDefault: true,
      }),
      num: 3,
    });

    console.log(data.RanaStack);
  }

  getZookeeperIps() {
    this.zookeeperCluster.getIps();
  }
}

module.exports = { RanaStack };
