const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const { ZookeeperCluster } = require("./constructs/zookeeper-construct");
const { KafkaCluster } = require("./constructs/kafka-construct");
const { JustinStack } = require("./lodge-app-justin-stack");
// const data = require("../ranaStack.json");

class KafkaStage extends cdk.Stage {
  constructor(scope, id, props) {
    super(scope, id, props);
    // zookeeper
    const rana = new RanaStack(scope, "RanaStack", {
      env: props.env,
    });
    // kafka with scripts
    const script = new StartingStack(scope, "StartingStack", {
      env: props.env,
      zookeeperInstances: rana.zookeeperCluster.instances,
    });
    script.addDependency(rana);

    // logstash with script
    const justin = new JustinStack(scope, "JustinStack", {
      env: props.env,
      kafkaInstances: script.kafkaCluster.instances,
    });
    justin.addDependency(script);
  }
}

class RanaStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.zookeeperCluster = new ZookeeperCluster(this, "Zookeeper-cluster", {
      vpc: ec2.Vpc.fromLookup(this, "ZK_VPC", {
        vpcId: "vpc-21b28859",
      }),
      num: 3,
    });
    // const kafkaCluster = new KafkaCluster(this, "Kafka-cluster", {
    //   vpc: ec2.Vpc.fromLookup(this, "K_VPC", {
    //     vpcId: "vpc-21b28859",
    //     //isDefault: true,
    //   }),
    //   num: 3,
    // });
  }

  // getZookeeperIps() {
  //   this.zookeeperCluster.getIps();
  // }
}

class StartingStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.kafkaCluster = new KafkaCluster(this, "Kafka-cluster", {
      vpc: ec2.Vpc.fromLookup(this, "K_VPC", {
        vpcId: "vpc-21b28859",
        //isDefault: true,
      }),
      num: 3,
      zookeeperInstances: props.zookeeperInstances,
    });

    // console.log("=============", props.zookeeperInstances);
    // const ip = props.zookeeperInstances[0].instancePrivateIp;
    // props.zookeeperInstances[0].userData.addCommands(`touch ${ip}`);
    // const test = new ec2.Instance(this, "TEST", {
    //   instanceType: ec2.InstanceType.of(
    //     ec2.InstanceClass.T2,
    //     ec2.InstanceSize.MEDIUM
    //   ),
    //   vpc: ec2.Vpc.fromLookup(this, "ZK_VPC", {
    //     vpcId: "vpc-21b28859",
    //   }),
    //   machineImage: ec2.MachineImage.lookup({
    //     name: "Zookeeper",
    //     owners: ["504304018644"],
    //   }),
    //   vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    //   keyName: "kafkaTutorial",
    // });
    // test.userData.addCommands(
    //   `touch ${props.zookeeperInstances[0].instancePrivateIp}`
    // );
  }
}

module.exports = { KafkaStage };
