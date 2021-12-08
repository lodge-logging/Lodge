const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
class KafkaCluster extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.instances = [];

    const machineImage = ec2.MachineImage.fromSsmParameter(
      "/aws/service/canonical/ubuntu/server/focal/stable/current/amd64/hvm/ebs-gp2/ami-id",
      ec2.OperatingSystemType.LINUX
    );

    for (let i = 1; i <= props.num; i++) {
      const kafka = new ec2.Instance(this, "kafka-instance" + i, {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T2,
          ec2.InstanceSize.MEDIUM
        ),
        vpc: props.vpc,
        machineImage: machineImage,
        vpcSubnets: {
          // subnets: [
          //   ec2.Subnet.fromSubnetAttributes(
          //     this,
          //     `BrokerSubnetFromAttributes${i}`,
          //     {
          //       subnetId: `${props.PrivateSubnets[i - 1].id}`,
          //       availabilityZone: `${props.PrivateSubnets[i - 1].az}`,
          //     }
          //   ),
          // ],
          subnets: [props.PrivateSubnets[i - 1]],
        },
        keyName: props.sshKey,
        securityGroup: props.securityGroup,
      });

      this.instances.push(kafka);

      const ip = kafka.instancePrivateIp;
      this.outputs = new cdk.CfnOutput(this, "KafkaExports" + i, {
        value: ip,
        exportName: `k-private-ip-${i}`,
      });

      let zookeeperIps = `${props.zookeeperInstances[0].instancePrivateIp}:2181,${props.zookeeperInstances[1].instancePrivateIp}:2181,${props.zookeeperInstances[2].instancePrivateIp}:2181/kafka`;

      let commands = [
        `rm /var/lib/cloud/instances/*/sem/config_scripts_user`,
        `sudo apt-get update`,
        `sudo apt-get -y install wget ca-certificates zip net-tools nano tar netcat`,
        `sudo apt-get -y install openjdk-8-jdk`,
        `sudo sysctl vm.swappiness=1`,
        `echo 'vm.swappiness=1' | sudo tee --append /etc/sysctl.conf`,
        `wget https://archive.apache.org/dist/kafka/2.2.0/kafka_2.12-2.2.0.tgz`,
        `tar -xvzf kafka_2.12-2.2.0.tgz`,
        `rm kafka_2.12-2.2.0.tgz`,
        `mv kafka_2.12-2.2.0 /home/ubuntu/kafka`,
        `sudo mkdir -p /data/kafka`,
        `echo "* hard nofile 100000
        * soft nofile 100000
        root hard nofile 100000
        root soft nofile 100000" | sudo tee --append /etc/security/limits.conf`,
        `sudo chown -R ubuntu:ubuntu /data/`,
        `cd /home/ubuntu/kafka`,
        `rm /home/ubuntu/kafka/config/server.properties`,
        `curl https://bandstand-s3.s3.us-west-2.amazonaws.com/server.properties -o /home/ubuntu/kafka/config/server.properties`,
        `curl https://bandstand-s3.s3.us-west-2.amazonaws.com/kafka -o /etc/init.d/kafka`,
        `sudo chmod +x /etc/init.d/kafka`,
        `sudo chown root:root /etc/init.d/kafka`,
        `sudo update-rc.d kafka defaults`,
        `cd /home/ubuntu/kafka`,
        `sudo /bin/kafka-server-start.sh -daemon config/server.properties`,
        `sleep 5`,
        `sudo service kafka stop`,
        `sleep 5`,
        `sed -i "s/broker.id=.*/broker.id=${i}/" /home/ubuntu/kafka/config/server.properties`,
        "var1=$(hostname -I | xargs)",
        'sed -i "s,advertised.listeners=.*,advertised.listeners=PLAINTEXT://$var1:9092," /home/ubuntu/kafka/config/server.properties',
        `sed -i "s|zookeeper.connect=.*|zookeeper.connect=${zookeeperIps}|" /home/ubuntu/kafka/config/server.properties`,
        `sed -i 's/broker.id=.*/broker.id=${i}/' /data/kafka/meta.properties`,
        `sudo service kafka start`,
      ];

      kafka.userData.addCommands(...commands);
    }
  }
}

module.exports = { KafkaCluster };
