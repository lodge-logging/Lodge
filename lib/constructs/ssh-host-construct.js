const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
// const iam = require("@aws-cdk/aws-iam");
const { readFileSync } = require("fs");
const path = require("path");

const keyPath = path.join(__dirname, "..", "..", "bin", "lodge-key.pem");

class SSHHost extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

    // const ec2Role = new iam.Role(this, "ec2-role", {
    //   assumedBy: new iam.CompositePrincipal(
    //     new iam.ServicePrincipal("ec2.amazonaws.com"),
    //     new iam.ServicePrincipal("ssm.amazonaws.com")
    //   ),
    //   managedPolicies: [
    //     iam.ManagedPolicy.fromManagedPolicyArn(
    //       this,
    //       "ssmManaged",
    //       "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
    //     ),
    //   ],
    // });
    // ESInstances: props.ESInstances,
    //   kafkaInstances: props.kafkaInstances,
    //   zookeeperInstances: props.zookeeperInstances,
    //   kibanaInstance: props.kibanaInstance,

    const sshHost = new ec2.Instance(this, "ssh-host", {
      vpc: props.vpc,
      instanceName: "Bastion-host",
      securityGroup: props.securityGroup,
      machineImage: new ec2.AmazonLinuxImage(),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      keyName: props.sshKey,
      role: props.ec2Role,
    });

    const key = readFileSync(keyPath, "utf-8");

    const commands = [
      `sudo mkdir .ssh`,
      `echo '${key}' | sudo tee .ssh/lodge-key.pem`,
      `sudo chmod 600 .ssh/lodge-key.pem`,
      //       `echo "#!/bin/bash\n
      // declare -A hosts\n
      // hosts[kafka1]=ubuntu@${props.kafkaInstances[0].instancePrivateIp}\n
      // hosts[kafka2]=ubuntu@${props.kafkaInstances[1].instancePrivateIp}\n
      // hosts[kafka3]=ubuntu@${props.kafkaInstances[2].instancePrivateIp}\n
      // hosts[zookeeper1]=ubuntu@${props.zookeeperInstances[0].instancePrivateIp}\n
      // hosts[zookeeper2]=ubuntu@${props.zookeeperInstances[1].instancePrivateIp}\n
      // hosts[zookeeper3]=ubuntu@${props.zookeeperInstances[2].instancePrivateIp}\n
      // hosts[es1]=ec2-user@${props.ESInstances[0].instancePrivateIp}\n
      // hosts[es2]=ec2-user@${props.ESInstances[1].instancePrivateIp}\n
      // hosts[es3]=ec2-user@${props.ESInstances[2].instancePrivateIp}\n
      // hosts[kibana]=ubuntu@${props.kibanaInstance.instancePrivateIp}\n
      // ssh -i /.ssh/lodge-key.pem  \${hosts[\"$0\"]}\n" | /lodge-connect2`,
      // `sudo chmod +x /lodge-connect2`,
      //       `sudo cat << EOF > /lodge-connect
      // #!/bin/bash
      // declare -A hosts
      // hosts[kafka1]=ubuntu@${props.kafkaInstances[0].instancePrivateIp}
      // hosts[kafka2]=ubuntu@${props.kafkaInstances[1].instancePrivateIp}
      // hosts[kafka3]=ubuntu@${props.kafkaInstances[2].instancePrivateIp}
      // hosts[zookeeper1]=ubuntu@${props.zookeeperInstances[0].instancePrivateIp}
      // hosts[zookeeper2]=ubuntu@${props.zookeeperInstances[1].instancePrivateIp}
      // hosts[zookeeper3]=ubuntu@${props.zookeeperInstances[2].instancePrivateIp}
      // hosts[es1]=ec2-user@${props.ESInstances[0].instancePrivateIp}
      // hosts[es2]=ec2-user@${props.ESInstances[1].instancePrivateIp}
      // hosts[es3]=ec2-user@${props.ESInstances[2].instancePrivateIp}
      // hosts[kibana]=ubuntu@${props.kibanaInstance.instancePrivateIp}
      // ssh -i /.ssh/lodge-key.pem  \${hosts["$0"]}
      // EOF\n`,
      `curl https://bandstand-s3.s3.us-west-2.amazonaws.com/lodge-connet.sh -o /bin/local/lodge-connect`,
      `sudo sed -i "s/hosts\[kafka1\]=ubuntu@.*/hosts\[kafka1\]=ubuntu@${props.kafkaInstances[0].instancePrivateIp}/" /bin/local/lodge-connect`,
      `sudo sed -i "s/hosts\[kafka2\]=ubuntu@.*/hosts\[kafka1\]=ubuntu@${props.kafkaInstances[1].instancePrivateIp}/" /bin/local/lodge-connect`,
      `sudo sed -i "s/hosts\[kafka3\]=ubuntu@.*/hosts\[kafka1\]=ubuntu@${props.kafkaInstances[2].instancePrivateIp}/" /bin/local/lodge-connect`,
      `sudo sed -i "s/hosts\[zookeeper1\]=ubuntu@.*/hosts\[zookeeper1\]=ubuntu@${props.zookeeperInstances[0].instancePrivateIp}/" /bin/local/lodge-connect`,
      `sudo sed -i "s/hosts\[zookeeper2\]=ubuntu@.*/hosts\[zookeeper2\]=ubuntu@${props.zookeeperInstances[1].instancePrivateIp}/" /bin/local/lodge-connect`,
      `sudo sed -i "s/hosts\[zookeeper3\]=ubuntu@.*/hosts\[zookeeper3\]=ubuntu@${props.zookeeperInstances[2].instancePrivateIp}/" /bin/local/lodge-connect`,
      `sudo sed -i "s/hosts\[es1\]=ec2-user@.*/hosts\[es1\]=ec2-user@${props.ESInstances[0].instancePrivateIp}/" /bin/local/lodge-connect`,
      `sudo sed -i "s/hosts\[es2\]=ec2-user@.*/hosts\[es2\]=ec2-user@${props.ESInstances[1].instancePrivateIp}/" /bin/local/lodge-connect`,
      `sudo sed -i "s/hosts\[es3\]=ec2-user@.*/hosts\[es3\]=ec2-user@${props.ESInstances[2].instancePrivateIp}/" /bin/local/lodge-connect`,
      `sudo sed -i "s/hosts\[kibana\]=ubuntu@.*/hosts\[kibana\]=ubuntu@${props.kibanaInstance.instancePrivateIp}/" /bin/local/lodge-connect`,
      `sudo sed -i "s/hosts\[webTools\]=ubuntu@.*/hosts\[webTools\]=ubuntu@${props.webToolsInstance.instancePrivateIp}/" /bin/local/lodge-connect`,
      `sudo chmod +x /bin/local/lodge-connect`,
    ];
    sshHost.userData.addCommands(...commands);
    // const sshHost = new ec2.BastionHostLinux(this, 'ssh-host', {
    //   vpc: props.vpc,
    //   instanceName: props.instanceName,
    //   securityGroup: props.securityGroup,
    // });

    this.outputs = new cdk.CfnOutput(this, "SSH-Exports", {
      value: sshHost.instanceId,
      exportName: `ssh-instance-id`,
    });
  }
}

module.exports = { SSHHost };
