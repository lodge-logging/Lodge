const cdk = require("@aws-cdk/core");
const { ZookeeperCluster } = require("./constructs/zookeeper-test");
const { KafkaCluster } = require("./constructs/kafka-test");
const { Elasticsearch } = require("./constructs/elasticsearch-test");

class Zookeeper extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.zookeeper = new ZookeeperCluster(this, "zookeeper", {
      vpc: props.vpc,
      sshKey: props.sshKey,
      num: 3,
      securityGroup: props.securityGroup,
    });
  }
}

class Kafka extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.kafkaCluster = new KafkaCluster(this, "Kafka-cluster", {
      vpc: props.vpc,
      sshKey: props.sshKey,
      num: 3,
      securityGroup: props.securityGroup,
      zookeeperInstances: props.zookeeperInstances,
    });
  }
}

class Es extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.EsCluster = new Elasticsearch(this, "Es-cluster", {
      vpc: props.vpc,
      sshKey: props.sshKey,
      securityGroup: props.securityGroup,
      esRole: props.esRole,
    });
  }
}

module.exports = { Zookeeper, Kafka, Es };
