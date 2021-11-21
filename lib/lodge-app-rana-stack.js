const cdk = require("@aws-cdk/core");

const { LodgeVPCStack } = require("../lib/stacks/vpc-stack");
const { LodgeZookeeperStack } = require("../lib/stacks/zookeeper-stack");
const { LodgeKafkaStack } = require("../lib/stacks/kafka-stack");
const { LodgeLogstashStack } = require("./lodge-app-justin-stack");
const { LodgeKibanaStack } = require("../lib/stacks/kibana-stack");
const { LodgeElasticsearchStack } = require("./lodge-app-sam-stack");
const { LodgeWebToolsStack } = require("../lib/stacks/webtools-stack");
const { LodgeS3Stack } = require("../lib/stacks/s3-stack");
const { LodgeIAMRoleStack } = require("../lib/stacks/iam-stack");

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

module.exports = { LodgeStage };
