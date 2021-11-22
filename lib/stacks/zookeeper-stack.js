const cdk = require("@aws-cdk/core");
const { ZookeeperCluster } = require("../constructs/zookeeper-construct");

class LodgeZookeeperStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.zookeeperCluster = new ZookeeperCluster(this, "Zookeeper-cluster", {
      vpc: props.vpc,
      sshKey: props.sshKey,
      num: 3,
      securityGroup: props.securityGroup,
    });
  }
}

module.exports = { LodgeZookeeperStack };
