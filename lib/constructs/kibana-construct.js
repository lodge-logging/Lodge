const cdk = require('@aws-cdk/core');
const ec2 = require('@aws-cdk/aws-ec2');
const { readFileSync } = require('fs');
const path = require('path');
const params = require('../params/kibana-params');

const userDataPath = path.join(__dirname, '..', '..', 'bin', 'instance-user-data', 'kibana-user-data.sh');

class Kibana extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

      this.instance = new ec2.Instance(this, 'Kibana', {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      //role: '',
      securityGroup: props.securityGroup,
      machineImage: ec2.MachineImage.latestAmazonLinux(),
      instanceType: params.InstanceType,
      keyName: props.sshKey,
    });

    // const userDataScript = readFileSync(userDataPath, 'utf8');
    // this.instance.addUserData(userDataScript);
  }
}

module.exports = { Kibana }