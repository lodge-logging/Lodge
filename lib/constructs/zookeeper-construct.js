const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const { getIps } = require("../utils/getIps");
class ZookeeperCluster extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);
    this.instances = [];

    const machineImage = ec2.MachineImage.fromSsmParameter(
      "/aws/service/canonical/ubuntu/server/focal/stable/current/amd64/hvm/ebs-gp2/ami-id",
      ec2.OperatingSystemType.LINUX
    );

    for (let i = 1; i <= props.num; i++) {
      const zookeeper = new ec2.Instance(this, "zk" + i, {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T2,
          ec2.InstanceSize.MEDIUM
        ),
        vpc: props.vpc,
        machineImage: machineImage,
        keyName: props.sshKey,
        securityGroup: props.securityGroup,
        privateIpAddress: getIps(
          props.PrivateSubnets[i - 1].ipv4CidrBlock,
          1
        )[0],
        vpcSubnets: {
          subnets: [props.PrivateSubnets[i - 1]],
        },
      });

      this.instances.push(zookeeper);

      zookeeper.userData.addCommands(
        `rm /var/lib/cloud/instances/*/sem/config_scripts_user`,
        `sudo apt-get update`,
        `sudo apt-get -y install wget ca-certificates zip net-tools nano tar netcat`,
        `sudo apt-get -y install openjdk-8-jdk`,
        `sudo sysctl vm.swappiness=1`,
        `echo 'vm.swappiness=1' | sudo tee --append /etc/sysctl.conf`,
        `wget https://archive.apache.org/dist/kafka/2.2.0/kafka_2.12-2.2.0.tgz`,
        `tar -xvzf kafka_2.12-2.2.0.tgz`,
        `rm kafka_2.12-2.2.0.tgz`,
        `mv kafka_2.12-2.2.0 /home/ubuntu/zookeeper`,
        `cd /home/ubuntu/zookeeper`,
        `sudo bin/zookeeper-server-start.sh -daemon config/zookeeper.properties`,
        `curl https://bandstand-s3.s3.us-west-2.amazonaws.com/zookeeper -o /etc/init.d/zookeeper`,
        `sudo chmod +x /etc/init.d/zookeeper`,
        `sudo chown root:root /etc/init.d/zookeeper`,
        `sudo update-rc.d zookeeper defaults`,
        `sleep 5`,
        `sudo service zookeeper stop`,
        `sleep 5`,
        `sudo mkdir -p /data/zookeeper`,
        `sudo chown -R ubuntu:ubuntu /data/`,
        `echo ${i} > /data/zookeeper/myid`,
        `rm /home/ubuntu/zookeeper/config/zookeeper.properties`,
        `curl https://bandstand-s3.s3.us-west-2.amazonaws.com/zookeeper.properties -o /home/ubuntu/zookeeper/config/zookeeper.properties`,
        `sed -i "s,server.1=.*,server.1=${
          getIps(props.PrivateSubnets[0].ipv4CidrBlock, 1)[0]
        }:2888:3888," /home/ubuntu/zookeeper/config/zookeeper.properties`,
        `sed -i "s,server.2=.*,server.2=${
          getIps(props.PrivateSubnets[1].ipv4CidrBlock, 1)[0]
        }:2888:3888," /home/ubuntu/zookeeper/config/zookeeper.properties`,
        `sed -i "s,server.3=.*,server.3=${
          getIps(props.PrivateSubnets[2].ipv4CidrBlock, 1)[0]
        }:2888:3888," /home/ubuntu/zookeeper/config/zookeeper.properties`,
        `cd /home/ubuntu/zookeeper`,
        `sudo bin/zookeeper-server-start.sh -daemon config/zookeeper.properties`,
        `sleep 5`,
        `sudo bin/zookeeper-server-stop.sh`,
        `sleep 5`,
        `sudo service zookeeper start`
      );

      const ip = zookeeper.instancePrivateIp;
      this.outputs = new cdk.CfnOutput(this, "ZookeeperExports" + i, {
        value: ip,
        exportName: `zk-private-ip-${i}`,
      });
    }
  }
}

module.exports = { ZookeeperCluster };
