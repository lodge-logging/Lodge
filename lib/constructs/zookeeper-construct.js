const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");

class ZookeeperCluster extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);
    this.instances = [];

    for (let i = 0; i < props.num; i++) {
      const zookeeper = new ec2.Instance(this, "zk" + i, {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T2,
          ec2.InstanceSize.MEDIUM
        ),
        vpc: props.vpc,
        machineImage: ec2.MachineImage.lookup({
          name: "kafka-zk-v2",
          owners: ["504304018644"],
        }),
        vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
        keyName: "kafkaTutorial",
      });

      this.instances.push(zookeeper);
    }

    //const ip = zookeeper.instancePrivateIp;
    // zookeeper.userData.addCommands("touch TEST_FILE");

    //console.log(`zk ${props.instanceNum} - ${ip}`);
    // new cdk.CfnOutput(this, "KafkaExports", {
    //   value: ip,
    //   exportName: "private-ip",
    // });
  }
}

module.exports = { ZookeeperCluster };
