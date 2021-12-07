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
      `curl https://bandstand-s3.s3.us-west-2.amazonaws.com/lodge-connect.sh -o /lodge-connect`,
      `sudo sed -i "s|hosts\\[kafka1\\]=.*|hosts\\[kafka1\\]=ubuntu\\@${props.kafkaInstances[0].instancePrivateIp}|" /lodge-connect`,
      `sudo sed -i "s|hosts\\[kafka2\\]=.*|hosts\\[kafka2\\]=ubuntu\\@${props.kafkaInstances[1].instancePrivateIp}|" /lodge-connect`,
      `sudo sed -i "s|hosts\\[kafka3\\]=.*|hosts\\[kafka3\\]=ubuntu\\@${props.kafkaInstances[2].instancePrivateIp}|" /lodge-connect`,
      `sudo sed -i "s|hosts\\[zookeeper1\\]=.*|hosts\\[zookeeper1\\]=ubuntu\\@${props.zookeeperInstances[0].instancePrivateIp}|" /lodge-connect`,
      `sudo sed -i "s|hosts\\[zookeeper2\\]=.*|hosts\\[zookeeper2\\]=ubuntu\\@${props.zookeeperInstances[1].instancePrivateIp}|" /lodge-connect`,
      `sudo sed -i "s|hosts\\[zookeeper3\\]=.*|hosts\\[zookeeper3\\]=ubuntu\\@${props.zookeeperInstances[2].instancePrivateIp}|" /lodge-connect`,
      `sudo sed -i "s|hosts\\[es1\\]=.*|hosts\\[es1\\]=ec2-user\\@${props.ESInstances[0].instancePrivateIp}|" /lodge-connect`,
      `sudo sed -i "s|hosts\\[es2\\]=.*|hosts\\[es2\\]=ec2-user\\@${props.ESInstances[1].instancePrivateIp}|" /lodge-connect`,
      `sudo sed -i "s|hosts\\[es3\\]=.*|hosts\\[es3\\]=ec2-user\\@${props.ESInstances[2].instancePrivateIp}|" /lodge-connect`,
      `sudo sed -i "s|hosts\\[kibana\\]=.*|hosts\\[kibana\\]=ubuntu\\@${props.kibanaInstance.instancePrivateIp}|" /lodge-connect`,
      `sudo sed -i "s|hosts\\[webTools\\]=.*|hosts\\[webTools\\]=ubuntu\\@${props.webToolsInstance.instancePrivateIp}|" /lodge-connect`,
      `sudo chmod +x /lodge-connect`,
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
