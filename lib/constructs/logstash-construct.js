const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const iam = require("@aws-cdk/aws-iam");
const autoscaling = require("@aws-cdk/aws-autoscaling");

// FileSystem access
const fs = require("fs");

class Logstash extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

    const s3Access = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          resources: [`${props.bucket.bucketArn}/*`],
          actions: ["s3:*"],
          // 👇 Default for `effect` is ALLOW
          effect: iam.Effect.ALLOW,
        }),
      ],
    });

    // 👇 Create role, to which we'll attach our Policies
    const role = new iam.Role(this, "ec2-s3-access", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      description: "An example IAM role in AWS CDK",
      inlinePolicies: {
        // 👇 attach the Policy Document as inline policies
        s3Access,
      },
    });

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
      role: role,
      // desiredCapacity: 2,
    });

    // props.kafkaInstance, an array of kafka instances that has the ip addresses, filter out the ip addresses and pass in to change

    // Sam's way - maybe through cdk.context.json
    // const commands = [`sed -i 's/bootstrap_servers =>.*/bootstrap_servers =>${props.kakfa[0].instancePrivateIp} /etc/logstash/conf.d/test.conf`,
    // `sed -i 's/hosts =>.*/hosts =>${props.elasticsearch[0].instancePrivateIp} /etc/logstash/conf.d/test.conf`
    // ];

    let brokersIps = `${props.kafkaInstances[0].instancePrivateIp}:9092,${props.kafkaInstances[1].instancePrivateIp}:9092,${props.kafkaInstances[2].instancePrivateIp}:9092`;

    let ESMasters = `"${props.ESInstances[0].instancePrivateIp}:9200","${props.ESInstances[1].instancePrivateIp}:9200","${props.ESInstances[2].instancePrivateIp}:9200"`;

    const commands = [
      `sed -i 's/bootstrap_servers =>.*/bootstrap_servers => "${brokersIps}"/' /etc/logstash/conf.d/test.conf`,
      `sed -i 's/hosts =>.*/hosts => [${ESMasters}]/' /etc/logstash/conf.d/test.conf`,
      `sed -i 's/bucket => "bandstand-s3"/bucket => "${props.bucket.bucketName}"' /etc/logstash/conf.d/test.conf`,
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
