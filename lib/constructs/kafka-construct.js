const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");

class KafkaCluster extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.instances = [];

    for (let i = 1; i <= props.num; i++) {
      const kafka = new ec2.Instance(this, "kafka-instance" + i, {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T2,
          ec2.InstanceSize.MEDIUM
        ),
        vpc: props.vpc,
        machineImage: ec2.MachineImage.lookup({
          name: "Kafka-Lodge",
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
      let zookeeperIps = `${props.zookeeperInstances[0].instancePrivateIp}:2181,${props.zookeeperInstances[1].instancePrivateIp}:2181,${props.zookeeperInstances[2].instancePrivateIp}:2181/kafka`;

      let commands = [
        `sed -i 's/broker.id=1/broker.id=${i}/' /home/ubuntu/kafka/config/server.properties`,
        "var1=$(hostname -I)",
        'sed -i "s,advertised.listeners=.*,advertised.listeners=PLAINTEXT://$var1:9092," /home/ubuntu/kafka/config/server.properties',
        `sed -i "s|zookeeper.connect=.*|zookeeper.connect=${zookeeperIps}|" /home/ubuntu/kafka/config/server.properties`,
        `sed -i 's/broker.id=1/broker.id=${i}/' /data/kafka/meta.properties`,
      ];

      kafka.userData.addCommands(...commands);
    }
  }
}

module.exports = { KafkaCluster };
