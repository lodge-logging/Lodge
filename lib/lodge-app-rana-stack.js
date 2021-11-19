const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const { ZookeeperCluster } = require("./constructs/zookeeper-construct");
const { KafkaCluster } = require("./constructs/kafka-construct");
const { JustinStack } = require("./lodge-app-justin-stack");
const { VPC } = require("./constructs/vpc-construct");
// const data = require("../ranaStack.json");

class KafkaStage extends cdk.Stage {
  constructor(scope, id, props) {
    super(scope, id, props);
    // vpc
    const lodgeVPC = new VpcStack(scope, "VpcStack", {
      env: props.env,
    });
    // zookeeper
    const rana = new RanaStack(scope, "RanaStack", {
      env: props.env,
      vpc: lodgeVPC.vpc,
      sshKey: lodgeVPC.sshKey,
      securityGroup: lodgeVPC.securityGroups.zookeeperSG,
    });
    rana.addDependency(lodgeVPC);
    // kafka with scripts
    const script = new StartingStack(scope, "StartingStack", {
      env: props.env,
      vpc: lodgeVPC.vpc,
      sshKey: lodgeVPC.sshKey,
      securityGroup: lodgeVPC.securityGroups.kafkaSG,
      zookeeperInstances: rana.zookeeperCluster.instances,
    });
    script.addDependency(rana);

    //logstash with script
    const justin = new JustinStack(scope, "JustinStack", {
      env: props.env,
      kafkaInstances: script.kafkaCluster.instances,
      vpc: lodgeVPC.vpc,
      sshKey: lodgeVPC.sshKey,
      securityGroup: lodgeVPC.securityGroups.logstashSG,
    });
    justin.addDependency(script);
  }
}

class VpcStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    const createSSHKey = () => "kafkaTutorial";
    this.sshKey = createSSHKey();

    const { vpc, securityGroups } = new VPC(this, "VPC");
    this.vpc = vpc;
    this.securityGroups = securityGroups;
    //const sharedProps = { vpc, sshKey };

    const sshHost = new ec2.BastionHostLinux(this, "ssh-host", {
      vpc,
      instanceName: "ssh-host",
      securityGroup: securityGroups.sshSG,
    });
  }
}

class RanaStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.zookeeperCluster = new ZookeeperCluster(this, "Zookeeper-cluster", {
      // vpc: ec2.Vpc.fromLookup(this, "ZK_VPC", {
      //   vpcId: "vpc-21b28859",
      // }),
      vpc: props.vpc,
      sshKey: props.sshKey,
      num: 3,
      securityGroup: props.securityGroup,
    });
  }
}

class StartingStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.kafkaCluster = new KafkaCluster(this, "Kafka-cluster", {
      // vpc: ec2.Vpc.fromLookup(this, "K_VPC", {
      //   vpcId: "vpc-21b28859",
      //   //isDefault: true,
      // }),
      vpc: props.vpc,
      sshKey: props.sshKey,
      num: 3,
      securityGroup: props.securityGroup,
      zookeeperInstances: props.zookeeperInstances,
    });
  }
}

module.exports = { KafkaStage };
