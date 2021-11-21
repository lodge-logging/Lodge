const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const { ZookeeperCluster } = require("./constructs/zookeeper-construct");
const { KafkaCluster } = require("./constructs/kafka-construct");
const { JustinStack } = require("./lodge-app-justin-stack");
const { VPC } = require("./constructs/vpc-construct");
const { Kibana } = require("./constructs/kibana-construct");
const { WebTools } = require("./constructs/webTool-construct");
const { SamStack } = require("./lodge-app-sam-stack");
const { s3Bucket } = require("../lib/constructs/s3-construct");

class LodgeStage extends cdk.Stage {
  constructor(scope, id, props) {
    super(scope, id, props);
    // vpc
    const lodgeVPC = new VpcStack(scope, "VpcStack", {
      env: props.env,
    });
    // elasticsearch
    const sam = new SamStack(scope, "SamStack", {
      env: props.env,
      vpc: lodgeVPC.vpc,
      sshKey: lodgeVPC.sshKey,
      securityGroup: lodgeVPC.securityGroups.elasticsearchSG,
    });
    sam.addDependency(lodgeVPC);

    // // s3
    // const s3stack = new s3Stack(scope, "s3Stack", {
    //   env: props.env,
    // });
    // // zookeeper
    // const rana = new RanaStack(scope, "RanaStack", {
    //   env: props.env,
    //   vpc: lodgeVPC.vpc,
    //   sshKey: lodgeVPC.sshKey,
    //   securityGroup: lodgeVPC.securityGroups.zookeeperSG,
    // });
    // rana.addDependency(lodgeVPC);

    // // kafka
    // const kafka = new KafkaStack(scope, "KafkaStack", {
    //   env: props.env,
    //   vpc: lodgeVPC.vpc,
    //   sshKey: lodgeVPC.sshKey,
    //   securityGroup: lodgeVPC.securityGroups.kafkaSG,
    //   zookeeperInstances: rana.zookeeperCluster.instances,
    // });
    // kafka.addDependency(rana);

    // //logstash
    // const justin = new JustinStack(scope, "JustinStack", {
    //   env: props.env,
    //   kafkaInstances: kafka.kafkaCluster.instances,
    //   vpc: lodgeVPC.vpc,
    //   sshKey: lodgeVPC.sshKey,
    //   securityGroup: lodgeVPC.securityGroups.logstashSG,
    //   ESInstances: sam.elasticsearch.masters,
    //   bucket: s3stack.bucket.instance,
    // });
    // justin.addDependency(kafka);
    // justin.addDependency(sam);
    // justin.addDependency(s3stack);

    // // webtools
    // const webtoolsStack = new WebToolsStack(scope, "WebToolsStack", {
    //   env: props.env,
    //   kafkaInstances: kafka.kafkaCluster.instances,
    //   vpc: lodgeVPC.vpc,
    //   sshKey: lodgeVPC.sshKey,
    //   securityGroup: lodgeVPC.securityGroups.webtoolSG,
    // });
    // webtoolsStack.addDependency(kafka);

    // kibana
    const kibana = new KibanaStack(scope, "KibanaStack", {
      env: props.env,
      vpc: lodgeVPC.vpc,
      sshKey: lodgeVPC.sshKey,
      securityGroup: lodgeVPC.securityGroups.kibanaSG,
      ESInstances: sam.elasticsearch.masters,
    });
    kibana.addDependency(sam);
  }
}

//---------------------------------------------------------------------------------

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
      vpc: props.vpc,
      sshKey: props.sshKey,
      num: 3,
      securityGroup: props.securityGroup,
    });
  }
}

class KafkaStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.kafkaCluster = new KafkaCluster(this, "Kafka-cluster", {
      vpc: props.vpc,
      sshKey: props.sshKey,
      num: 3,
      securityGroup: props.securityGroup,
      zookeeperInstances: props.zookeeperInstances,
    });
  }
}

// kibana stack
class KibanaStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.kibana = new Kibana(this, "Kibana", {
      vpc: props.vpc,
      sshKey: props.sshKey,
      securityGroup: props.securityGroup,
      ESInstances: props.ESInstances,
    });
  }
}

// web tool stack
class WebToolsStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.kibana = new WebTools(this, "WebTools", {
      vpc: props.vpc,
      sshKey: props.sshKey,
      securityGroup: props.securityGroup,
      kafkaInstances: props.kafkaInstances,
    });
  }
}

// s3 stack
class s3Stack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.bucket = new s3Bucket(this, "s3Bucket", {
      vpc: props.vpc,
    });
  }
}

module.exports = { LodgeStage };
