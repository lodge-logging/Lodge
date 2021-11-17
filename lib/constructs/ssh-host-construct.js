const cdk = require('@aws-cdk/core');
const ec2 = require('@aws-cdk/aws-ec2');
const iam = require('@aws-cdk/aws-iam');
const { readFileSync } = require('fs');
// const path = require('path');

// const userDataPath = path.join(__dirname, '..', '..', 'bin', 'instance-user-data', 'ssh-user-data.sh');

class SSHHost extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

    const sshHost = new ec2.BastionHostLinux(this, 'ssh-host', {
      vpc: props.vpc,
      instanceName: props.instanceName,
      securityGroup: props.securityGroup,
    });

    const ec2Role = new iam.Role(this,'ec2-role', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('ec2.amazonaws.com'),
        new iam.ServicePrincipal('ssm.amazonaws.com')
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromManagedPolicyArn(this, 'ssmManaged', 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore')
      ]
    });
    
    this.outputs = new cdk.CfnOutput(this, 'SSH-Exports', {
      value: sshHost.instancePrivateIp,
      exportName: `ssh-private-ip`
    });

  }
}

module.exports = { SSHHost }