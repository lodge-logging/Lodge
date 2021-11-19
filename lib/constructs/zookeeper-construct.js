const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");

class ZookeeperCluster extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);
    this.instances = [];

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
        //vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        keyName: props.sshKey,
        securityGroup: props.securityGroup,
        instancePrivateIp: `10.0.0.${num + i}`,
      });

      this.instances.push(zookeeper);

      const ip = zookeeper.instancePrivateIp;
      zookeeper.userData.addCommands(
        `echo ${i} > /data/zookeeper/myid`,
        `sed -i "s,server.1=.*,server.1=10.0.0.4:2888:3888," /home/ubuntu/zookeeper/config/zookeeper.properties`,
        `sed -i "s,server.2=.*,server.2=10.0.0.5:2888:3888," /home/ubuntu/zookeeper/config/zookeeper.properties`,
        `sed -i "s,server.3=.*,server.3=10.0.0.6:2888:3888," /home/ubuntu/zookeeper/config/zookeeper.properties`
      );
      this.outputs = new cdk.CfnOutput(this, "ZookeeperExports" + i, {
        value: ip,
        exportName: `zk-private-ip-${i}`,
      });
    }
  }

  // getIps() {
  //   Object.keys(this.outputs).forEach((output) => {
  //     console.log(this.outputs[output]);
  //   });
  // this.instances.forEach((i) => {
  //   console.log(i.instancePrivateIp);
  // });
  //}
}

module.exports = { ZookeeperCluster };
