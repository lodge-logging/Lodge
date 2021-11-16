const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");

class KafkaCluster extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.instances = [];

    for (let i = 0; i < props.num; i++) {
      const kafka = new ec2.Instance(this, "kafka-instance" + i, {
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

      this.instances.push(kafka);

      const ip = kafka.instancePrivateIp;
      this.outputs = new cdk.CfnOutput(this, "KafkaExports" + i, {
        value: ip,
        exportName: `k-private-ip-${i}`,
      });
    }
    // kafka.userData.addCommands("touch TEST_FILE");
  }
}

module.exports = { KafkaCluster };
