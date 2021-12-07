const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const autoscaling = require("@aws-cdk/aws-autoscaling");
class Logstash extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

    const logstashASG = new autoscaling.AutoScalingGroup(this, "logstash-ASG", {
      vpc: props.vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE2,
        ec2.InstanceSize.MEDIUM
      ),
      vpcSubnets: {
        subnets: [
          ec2.Subnet.fromSubnetAttributes(
            this,
            `LogstashSubnetFromAttributes1`,
            {
              subnetId: `${props.privateSubnets[0].id}`,
              availabilityZone: `${props.privateSubnets[0].az}`,
            }
          ),
        ],
      },
      //vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: props.securityGroup,
      keyName: props.sshKey,
      machineImage: new ec2.AmazonLinuxImage(),
      minCapacity: 1,
      maxCapacity: 5,
      role: props.s3Role,
      //desiredCapacity: 2,
    });

    let brokersIps = `${props.kafkaInstances[0].instancePrivateIp}:9092,${props.kafkaInstances[1].instancePrivateIp}:9092,${props.kafkaInstances[2].instancePrivateIp}:9092`;

    let ESMasters = `"http://${props.ESInstances[0].instancePrivateIp}:9200","http://${props.ESInstances[1].instancePrivateIp}:9200","http://${props.ESInstances[2].instancePrivateIp}:9200"`;

    const commands = [
      `rm /var/lib/cloud/instances/*/sem/config_scripts_user`,
      `sudo yum update -y`,
      `sudo rpm --import https://artifacts.elastic.co/GPG-KEY-elasticsearch`,
      // create logstash.repo
      `touch logstash.repo`,
      `echo "[logstash-7.x]\nname=Elastic repository for 7.x packages\nbaseurl=https://artifacts.elastic.co/packages/7.x/yum\ngpgcheck=1\ngpgkey=https://artifacts.elastic.co/GPG-KEY-elasticsearch\nenabled=1\nautorefresh=1\ntype=rpm-md" >> logstash.repo`,
      // move logstash.repo to within /etc/yum.repos.d/
      `sudo mv /logstash.repo /etc/yum.repos.d/`,
      `sudo yum -y install logstash`,
      // `touch /etc/logstash/conf.d/logstash.conf`,
      `curl https://bandstand-s3.s3.us-west-2.amazonaws.com/logstash.conf -o /etc/logstash/conf.d/logstash.conf`,
      `sudo sed -i 's/bootstrap_servers =>.*/bootstrap_servers => "${brokersIps}"/' /etc/logstash/conf.d/logstash.conf`,
      `sudo sed -i 's|hosts =>.*|hosts => \[${ESMasters}\]|' /etc/logstash/conf.d/logstash.conf`,
      `sudo sed -i 's/bucket => "bandstand-s3"/bucket => "${props.bucket.bucketName}"/' /etc/logstash/conf.d/logstash.conf`,
      `/usr/share/logstash/bin/logstash -f /etc/logstash/conf.d/logstash.conf --config.reload.automatic`,
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
