const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const { ZookeeperCluster } = require("./constructs/zookeeper-construct");
const { KafkaCluster } = require("./constructs/kafka-construct");
const { LodgeLogstashStack } = require("./lodge-app-justin-stack");
const { VPC } = require("./constructs/vpc-construct");
const { Kibana } = require("./constructs/kibana-construct");
const { WebTools } = require("./constructs/webTool-construct");
const { LodgeElasticsearchStack } = require("./lodge-app-sam-stack");
const { s3Bucket } = require("../lib/constructs/s3-construct");
const { IAMRole } = require("./constructs/IAM-Roles-construct");

class LodgeStage extends cdk.Stage {
  constructor(scope, id, props) {
    super(scope, id, props);
    // vpc
    const lodgeVPC = new LodgeVPCStack(scope, "LodgeVPCStack", {
      env: props.env,
    });

    // s3
    const lodgeS3 = new LodgeS3Stack(scope, "LodgeS3Stack", {
      env: props.env,
    });

    // IAM roles
    const lodgeIAMRoles = new LodgeIAMRoleStack(scope, "LodgeIAMRoleStack", {
      env: props.env,
      bucket: lodgeS3.bucket.instance,
    });
    lodgeIAMRoles.addDependency(lodgeS3);

    // elasticsearch
    const lodgeElasticsearch = new LodgeElasticsearchStack(
      scope,
      "LodgeElasticsearchStack",
      {
        env: props.env,
        vpc: lodgeVPC.vpc,
        sshKey: lodgeVPC.sshKey,
        securityGroup: lodgeVPC.securityGroups.elasticsearchSG,
      }
    );
    lodgeElasticsearch.addDependency(lodgeVPC);

    // zookeeper
    const lodgeZookeeper = new LodgeZookeeperStack(
      scope,
      "LodgeZookeeperStack",
      {
        env: props.env,
        vpc: lodgeVPC.vpc,
        sshKey: lodgeVPC.sshKey,
        securityGroup: lodgeVPC.securityGroups.zookeeperSG,
      }
    );
    lodgeZookeeper.addDependency(lodgeVPC);

    // kafka
    const lodgeKafka = new LodgeKafkaStack(scope, "LodgeKafkaStack", {
      env: props.env,
      vpc: lodgeVPC.vpc,
      sshKey: lodgeVPC.sshKey,
      securityGroup: lodgeVPC.securityGroups.kafkaSG,
      zookeeperInstances: lodgeZookeeper.zookeeperCluster.instances,
    });
    lodgeKafka.addDependency(lodgeZookeeper);

    //logstash
    const lodgeLogstash = new LodgeLogstashStack(scope, "LodgeLogstashStack", {
      env: props.env,
      kafkaInstances: lodgeKafka.kafkaCluster.instances,
      vpc: lodgeVPC.vpc,
      sshKey: lodgeVPC.sshKey,
      securityGroup: lodgeVPC.securityGroups.logstashSG,
      ESInstances: lodgeElasticsearch.elasticsearch.masters,
      bucket: lodgeS3.bucket.instance,
      s3Role: lodgeIAMRoles.iamRole.s3Role,
    });
    lodgeLogstash.addDependency(lodgeKafka);
    lodgeLogstash.addDependency(lodgeElasticsearch);
    lodgeLogstash.addDependency(lodgeS3);
    lodgeLogstash.addDependency(lodgeIAMRoles);

    // webtools
    const lodgeWebTools = new LodgeWebToolsStack(scope, "LodgeWebToolsStack", {
      env: props.env,
      kafkaInstances: lodgeKafka.kafkaCluster.instances,
      vpc: lodgeVPC.vpc,
      sshKey: lodgeVPC.sshKey,
      securityGroup: lodgeVPC.securityGroups.webtoolSG,
      s3Role: lodgeIAMRoles.iamRole.s3Role,
    });
    lodgeWebTools.addDependency(lodgeKafka);
    lodgeWebTools.addDependency(lodgeIAMRoles);

    // kibana
    const lodgeKibana = new LodgeKibanaStack(scope, "LodgeKibanaStack", {
      env: props.env,
      vpc: lodgeVPC.vpc,
      sshKey: lodgeVPC.sshKey,
      securityGroup: lodgeVPC.securityGroups.kibanaSG,
      ESInstances: lodgeElasticsearch.elasticsearch.masters,
    });
    lodgeKibana.addDependency(lodgeElasticsearch);
  }
}

//---------------------------------------------------------------------------------

class LodgeVPCStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    const createSSHKey = () => "Your SSH key name";
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

class LodgeZookeeperStack extends cdk.Stack {
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

class LodgeKafkaStack extends cdk.Stack {
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
class LodgeKibanaStack extends cdk.Stack {
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
class LodgeWebToolsStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.webtools = new WebTools(this, "WebTools", {
      vpc: props.vpc,
      sshKey: props.sshKey,
      securityGroup: props.securityGroup,
      kafkaInstances: props.kafkaInstances,
      s3Role: props.s3Role,
    });
  }
}

// s3 stack
class LodgeS3Stack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.bucket = new s3Bucket(this, "s3Bucket", {
      vpc: props.vpc,
    });
  }
}

// IAM stack
class LodgeIAMRoleStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.iamRole = new IAMRole(this, "IAMRole", {
      vpc: props.vpc,
      bucket: props.bucket,
    });
  }
}

module.exports = { LodgeStage };
