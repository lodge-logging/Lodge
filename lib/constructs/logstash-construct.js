const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const autoscaling = require("@aws-cdk/aws-autoscaling");

// FileSystem access
const fs = require("fs");

class Logstash extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

    const ami = ec2.MachineImage.lookup({
      name: "Logstash-Lodge",
    });

    const logstashASG = new autoscaling.AutoScalingGroup(this, "logstash-ASG", {
      vpc: props.vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MEDIUM
      ),
      machineImage: ami,
      minCapacity: 1,
      maxCapacity: 5,
      desiredCapacity: 2,
    });

    // props.kafkaInstance, an array of kafka instances that has the ip addresses, filter out the ip addresses and pass in to change

    // Sam's way - maybe through cdk.context.json
    // const commands = [`sed -i 's/bootstrap_servers =>.*/bootstrap_servers =>${props.kakfa[0].instancePrivateIp} /etc/logstash/conf.d/test.conf`,
    // `sed -i 's/hosts =>.*/hosts =>${props.elasticsearch[0].instancePrivateIp} /etc/logstash/conf.d/test.conf`
    // ];

    let brokersIps = `${props.kafkaInstances[0].instancePrivateIp}:9092,${props.kafkaInstances[1].instancePrivateIp}:9092,${props.kafkaInstances[2].instancePrivateIp}:9092`;

    const commands = [
      `sed -i 's/bootstrap_servers =>.*/bootstrap_servers => "${brokersIps}"/' /etc/logstash/conf.d/test.conf`,
      `sed -i 's/hosts =>.*/hosts => ["987.6.5.4:9200"]/' /etc/logstash/conf.d/test.conf`,
    ];

    logstashASG.userData.addCommands(...commands);

    logstashASG.scaleOnCpuUtilization("CpuScaling", {
      targetUtilizationPercent: 50,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });
  }
}

module.exports = { Logstash };
