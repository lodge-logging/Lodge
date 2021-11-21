const cdk = require('@aws-cdk/core');
const ec2 = require('@aws-cdk/aws-ec2');
const iam = require('@aws-cdk/aws-iam');
const { readFileSync } = require('fs');
const path = require('path');

const keyPath = path.join(__dirname, '..', '..', 'bin', 'lodge-key.pem');

class SSHHost extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

    const ec2Role = new iam.Role(this,'ec2-role', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('ec2.amazonaws.com'),
        new iam.ServicePrincipal('ssm.amazonaws.com')
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromManagedPolicyArn(this, 'ssmManaged', 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore')
      ]
    });

    const sshHost = new ec2.Instance(this, 'ssh-host', {
      vpc: props.vpc,
      instanceName: props.instanceName,
      securityGroup: props.securityGroup,
      machineImage: new ec2.AmazonLinuxImage(),
      instanceType: 't2.micro',
      role: ec2Role,
    });

    const key = readFileSync(keyPath, 'utf-8');
    
    const commands = [
      'sudo mkdir .ssh',
      `echo '${key}' | sudo tee .ssh/lodge-key.pem`,
      'sudo chmod 600 .ssh/lodge-key.pem'
    ]

    sshHost.userData.addCommands(...commands);
    // const sshHost = new ec2.BastionHostLinux(this, 'ssh-host', {
    //   vpc: props.vpc,
    //   instanceName: props.instanceName,
    //   securityGroup: props.securityGroup,
    // });
    
    this.outputs = new cdk.CfnOutput(this, 'SSH-Exports', {
      value: sshHost.instanceId,
      exportName: `ssh-private-ip`
    });

  }
}

module.exports = { SSHHost }