const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");

class WebTools extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

    const webtools = new ec2.Instance(this, "WebTools", {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      securityGroup: props.securityGroup,
      machineImage: ec2.MachineImage.lookup({
        name: "KafkaClusterWebTools",
        owners: ["504304018644"],
      }),
      keyName: props.sshKey,
    });

    let brokersIps = `${props.kafkaInstances[0].instancePrivateIp}:9092,${props.kafkaInstances[1].instancePrivateIp}:9092,${props.kafkaInstances[2].instancePrivateIp}:9092`;

    webtools.userData.addCommands(
      `rm /var/lib/cloud/instances/*/sem/config_scripts_user`,
      `docker run -p 8080:8080 -e KAFKA_BROKERS=${brokersIps} quay.io/cloudhut/kowl:masterdocker`
    );
  }
}

module.exports = { WebTools };
