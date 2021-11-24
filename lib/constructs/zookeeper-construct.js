const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");

const ips = ["10.0.0.5", "10.0.0.7", "10.0.0.9"];

class ZookeeperCluster extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);
    this.instances = [];

    // const ips = this.node.tryGetContext("IP_ADDRESSES").split(",");

    for (let i = 1; i <= props.num; i++) {
      const zookeeper = new ec2.Instance(this, "zk" + i, {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T2,
          ec2.InstanceSize.MEDIUM
        ),
        vpc: props.vpc,
        machineImage: ec2.MachineImage.lookup({
          name: "Zookeeper-Lodge",
          owners: ["504304018644"],
        }),
        vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
        keyName: props.sshKey,
        securityGroup: props.securityGroup,
        privateIpAddress: `${ips[i - 1]}`,
      });

      this.instances.push(zookeeper);

      const ip = zookeeper.instancePrivateIp;
      zookeeper.userData.addCommands(
        `rm /var/lib/cloud/instances/*/sem/config_scripts_user`,
        `echo ${i} > /data/zookeeper/myid`,
        `sed -i "s,#server.1=.*,server.1=${ips[0]}:2888:3888," /home/ubuntu/zookeeper/config/zookeeper.properties`,
        `sed -i "s,#server.2=.*,server.2=${ips[1]}:2888:3888," /home/ubuntu/zookeeper/config/zookeeper.properties`,
        `sed -i "s,#server.3=.*,server.3=${ips[2]}:2888:3888," /home/ubuntu/zookeeper/config/zookeeper.properties`
      );

      this.outputs = new cdk.CfnOutput(this, "ZookeeperExports" + i, {
        value: ip,
        exportName: `zk-private-ip-${i}`,
      });
    }

    this.instances.forEach((instance) =>
      instance.userData.addCommands(`sudo service zookeeper start`)
    );
  }
}

module.exports = { ZookeeperCluster };
