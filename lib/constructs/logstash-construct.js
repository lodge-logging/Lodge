const cdk = require('@aws-cdk/core');
const ec2 = require('@aws-cdk/aws-ec2');
const autoscaling = require('@aws-cdk/aws-autoscaling');

// FileSystem access
const fs = require('fs');

class Logstash extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

    const ami = ec2.MachineImage.lookup({
      name: "Logstash",
      owners: ["504304018644"],
    });

    const logstashASG = new autoscaling.AutoScalingGroup(this, 'logstash-ASG', {
      vpc: props.vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MEDIUM),
      machineImage: ami,
      minCapacity: 1,
      maxCapacity: 5,
      desiredCapacity: 2,
    });

    logstashASG.userData.addCommands("touch TEST_FILE");

    logstashASG.scaleOnCpuUtilization('CpuScaling', { targetUtilizationPercent: 50, scaleInCooldown: cdk.Duration.seconds(60), scaleOutCooldown: cdk.Duration.seconds(60),})
  }
}

module.exports = { Logstash };