const cdk = require('@aws-cdk/core');
const ec2 = require('@aws-cdk/aws-ec2');
//const iam = require('@aws-cdk/aws-iam');
const autoscaling = require('@aws-cdk/aws-autoscaling');
const { insertIPsIntoConfig } = require('../utils/addIPs');
//const params = require('../params/elasticsearch-params');
// const { readFileSync } = require('fs');
// const path = require('path');

// const master1UserDataPath = path.join(__dirname, '..', '..', 'bin', 'instance-user-data', 'es-master1-user-data.sh');
// const master2UserDataPath = path.join(__dirname, '..', '..', 'bin', 'instance-user-data', 'es-master2-user-data.sh');
// const voteOnlyUserDataPath = path.join(__dirname, '..', '..', 'bin', 'instance-user-data', 'es-vote-only-user-data.sh');
// const dataHotUserDataPath = path.join(__dirname, '..', '..', 'bin', 'instance-user-data', 'es-data-hot-user-data.sh');
// const dataWarmUserDataPath = path.join(__dirname, '..', '..', 'bin', 'instance-user-data', 'es-data-warm-user-data.sh');
// const dataColdUserDataPath = path.join(__dirname, '..', '..', 'bin', 'instance-user-data', 'es-data-cold-user-data.sh');

const params = {
  MasterInstanceType: 't2.micro',
  VoteOnlyInstanceType: 't2.micro',
  DataHotInstanceType: 't2.micro',
  DataWarmInstanceType: 't2.micro',
  MinDataNodes: '2',
  MaxHotDataNodes: '3',
  MaxWarmDataNodes: '3',
}

class Elasticsearch extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

    // iam.Role();
    const subnets = props.vpc.isolatedSubnets;
    
    const output = this.node.tryGetContext('output');

    const master1 = new ec2.Instance(this, 'ES-Master-1', {
      vpc: props.vpc,
      machineImage: new ec2.AmazonLinuxImage(),
      instanceType: new ec2.InstanceType(params.MasterInstanceType),
      securityGroup: props.securityGroup,
      vpcSubnets: {
        subnets: [subnets[0]],
      },
      keyName: props.sshKey,
      //blockDevices: [],
      //instanceName: '',
      //privateIpAddress: ''
      //resourceSignalTimeout: new cdk.Duration()
      //role: '',
      //sourceDestCheck: true || false,
      // userDataCausesReplacement: true || false,
    });
    const master2 = new ec2.Instance(this, 'ES-Master-2', {
      vpc: props.vpc,
      machineImage: new ec2.AmazonLinuxImage(),
      instanceType: new ec2.InstanceType(params.MasterInstanceType),
      securityGroup: props.securityGroup,
      vpcSubnets: {
        subnets: [subnets[1]],
      },
      keyName: props.sshKey,
      //role: '',
    });
    const voteOnly = new ec2.Instance(this, 'ES-Vote-Only', {
      vpc: props.vpc,
      machineImage: new ec2.AmazonLinuxImage(),
      instanceType: new ec2.InstanceType(params.VoteOnlyInstanceType),
      securityGroup: props.securityGroup,
      
      vpcSubnets: {
        subnets: [subnets[0]],
      },
      keyName: props.sshKey,
      //role: '',
    });
    // const dataHotASG = new autoscaling.AutoScalingGroup(this, 'Data-Hot-ASG', {
    //   vpc: props.vpc,
    //   machineImage: new ec2.AmazonLinuxImage(),
    //   instanceType: new ec2.InstanceType(params.DataHotInstanceType),
    //   securityGroup: props.securityGroup,
    //   allowAllOutbound: false,
    //   minCapacity: params.MinDataNodes,
    //   maxCapacity: params.MaxHotDataNodes,
    //   //healthCheck: new autoscaling.HealthCheck('ec2', new cdk.Duration(100)),
    //   keyName: props.sshKey,
    //   vpcSubnets: {
    //     subnets,
    //   }
    //   // autoScalingGroupName: '',
    //   // blockDevices: [],
    //   // cooldown: cdk.Duration.minutes(5),
    //   // GroupMetrics: [],
    //   // instanceMonitoring: Monitoring.BASIC || Monitoring.DETAILED,
    //   // role: '',
    //   // signals: new autoscaling.Signals()

    // });
    // const dataWarmASG = new autoscaling.AutoScalingGroup(this, 'Data-Warm-ASG', {
    //   vpc: props.vpc,
    //   machineImage: new ec2.AmazonLinuxImage(),
    //   instanceType: new ec2.InstanceType(params.DataWarmInstanceType),
    //   securityGroup: props.securityGroup,
    //   allowAllOutbound: false,
    //   minCapacity: params.MinDataNodes,
    //   maxCapacity: params.MaxWarmDataNodes,
    //   //healthCheck: new autoscaling.HealthCheck('ec2', new cdk.Duration(params.HealthCheckGracePeriod)),
    //   keyName: props.sshKey,
    //   vpcSubnets: {
    //     subnets,
    //   }
    //   // autoScalingGroupName: '',
    //   // blockDevices: [],
    //   // cooldown: cdk.Duration.minutes(5),
    //   // GroupMetrics: [],
    //   // instanceMonitoring: Monitoring.BASIC || Monitoring.DETAILED,
    //   // role: '',
    //   // signals: new autoscaling.Signals()
    // });

    this.masters = [master1, master2, voteOnly];

    if (output.SamStack) {
      const ES_IPs = Object.entries(output.SamStack).map(entry => {
        if (entry[0].includes('ESExports')) {
          return entry[1];
        } 
        return null;
      }).filter(ip => ip);
      this.masters.forEach((master, idx) => {
        master.userData.addCommands(`touch test${ES_IPs[idx]}.txt`);
        master.instancePrivateIp = ES_IPs[idx];
      });
    } else {
      console.log('output is empty');
      this.masters.forEach(master => {
        master.userData.addCommands('rm /var/lib/cloud/instances/*/sem/config_scripts_user');
      });
    }
    this.masters.forEach((node, i) => {
      this.outputs = new cdk.CfnOutput(this, 'ESExports' + i, {
        value: node.instancePrivateIp,
        exportName: `es-private-ip-${i}`
      })
    });
    // ------------------------------------------------

    // this.dataColdASG = new autoscaling.AutoScalingGroup(this, 'Data-Cold-ASG', {
    //   vpc: props.vpc,
    //   machineImage: new ec2.AmazonLinuxImage(),
    //   instanceType: new ec2.InstanceType(params.DataColdInstanceType),
    //   securityGroup: props.securityGroup,
    //   allowAllOutbound: false,
    //   minCapacity: params.MinDataNodes,
    //   maxCapacity: params.MaxColdDataNodes,
    //   //healthCheck: new autoscaling.HealthCheck('ec2', new cdk.Duration(params.HealthCheckGracePeriod)),
    //   keyName: props.sshKey,
    //   vpcSubnets: {
    //     subnets,
    //   }
    //   // autoScalingGroupName: '',
    //   // blockDevices: [],
    //   // cooldown: cdk.Duration.minutes(5),
    //   // GroupMetrics: [],
    //   // instanceMonitoring: Monitoring.BASIC || Monitoring.DETAILED,
    //   // role: '',
    //   // signals: new autoscaling.Signals()
    // });

    // USER DATA
    // const master1UserDataScript = readFileSync(master1UserDataPath, 'utf8');    
    // const master2UserDataScript = readFileSync(master2UserDataPath, 'utf8');
    // const voteOnlyUserDataScript = readFileSync(voteOnlyUserDataPath, 'utf8');
    // const dataHotUserDataScript = readFileSync(dataHotUserDataPath, 'utf8');
    // const dataWarmUserDataScript = readFileSync(dataWarmUserDataPath, 'utf8');
    // const dataColdUserDataScript = readFileSync(dataColdUserDataPath, 'utf8');

    // this.master1.addUserData(master1UserDataScript);
    // this.master2.addUserData(master2UserDataScript);
    // this.voteOnly.addUserData(voteOnlyUserDataScript);
    // this.dataHotASG.addUserData(dataHotUserDataScript);
    // this.dataWarmASG.addUserData(dataWarmUserDataScript);
    // this.dataColdASG.addUserData(dataColdUserDataScript);

    // CLOUDFORMATION INIT
    // applyCloudFormationInit(init, options?)

    // SCALING METHODS
    // scaleOnCpuUtilization(id, props) => Scale out or in to achieve a target CPU utilization.
    // scaleToTrackMetric(id, props) => Scale out or in in order to keep a metric around a target value.
    // scaleOnMetric(id, props) => Scale out or in, in response to a metric.
    // scaleOnIncomingBytes(id, props) => Scale out or in to achieve a target network ingress rate.
    // scaleOnOutgoingBytes(id, props) => Scale out or in to achieve a target network egress rate.
  }
}

module.exports = { Elasticsearch }