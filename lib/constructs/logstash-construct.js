const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const autoscaling = require("@aws-cdk/aws-autoscaling");

class Logstash extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

    // const s3Access = new iam.PolicyDocument({
    //   statements: [
    //     new iam.PolicyStatement({
    //       resources: [`${props.bucket.bucketArn}/*`],
    //       actions: ["s3:*"],
    //       // 👇 Default for `effect` is ALLOW
    //       effect: iam.Effect.ALLOW,
    //     }),
    //   ],
    // });

    // // 👇 Create role, to which we'll attach our Policies
    // const role = new iam.Role(this, "ec2-s3-access", {
    //   assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    //   description: "An example IAM role in AWS CDK",
    //   inlinePolicies: {
    //     // 👇 attach the Policy Document as inline policies
    //     s3Access,
    //   },
    // });

    const ami = ec2.MachineImage.lookup({
      name: "Logstash-Lodge",
      owners: ["504304018644"],
    });

    const logstashASG = new autoscaling.AutoScalingGroup(this, "logstash-ASG", {
      vpc: props.vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MEDIUM
      ),
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: props.securityGroup,
      machineImage: ami,
      minCapacity: 1,
      maxCapacity: 5,
      role: props.s3Role,
      //desiredCapacity: 2,
    });

    let brokersIps = `${props.kafkaInstances[0].instancePrivateIp}:9092,${props.kafkaInstances[1].instancePrivateIp}:9092,${props.kafkaInstances[2].instancePrivateIp}:9092`;

    let ESMasters = `"http://${props.ESInstances[0].instancePrivateIp}:9200","http://${props.ESInstances[1].instancePrivateIp}:9200","http://${props.ESInstances[2].instancePrivateIp}:9200"`;

    const commands = [
      `rm /var/lib/cloud/instances/*/sem/config_scripts_user`,
      `sed -i 's/bootstrap_servers =>.*/bootstrap_servers => "${brokersIps}"/' /etc/logstash/conf.d/test.conf`,
      `sed -i 's/hosts =>.*/hosts => [${ESMasters}]/' /etc/logstash/conf.d/test.conf`,
      `sed -i 's/bucket => "bandstand-s3"/bucket => "${props.bucket.bucketName}"/' /etc/logstash/conf.d/test.conf`,
      `/usr/share/logstash/bin/logstash -f /etc/logstash/conf.d/test.conf --config.reload.automatic`,
    ];

    // add multi-kafka-topics to logsatsh

    logstashASG.userData.addCommands(...commands);

    logstashASG.scaleOnCpuUtilization("CpuScaling", {
      targetUtilizationPercent: 50,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });
  }
}

module.exports = { Logstash };
