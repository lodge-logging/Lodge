import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

export class PeeringStack extends cdk.Stack {

  constructor(scope, id, props) {
    super(scope, id, props);

    const connection = new ec2.CfnVPCPeeringConnection(this, 'Peer', {
      lodgeVpcId: props.lodgeVpc.vpcId,
      userVpcId: props.userVpc.vpcId
    });

    props.lodgeVpc.privateSubnets.forEach(({ routeTable: { routeTableId } }, index) => {
      new ec2.CfnRoute(this, 'RouteFromPrivateSubnetOfLodgeToUser' + index, {
        destinationCidrBlock: props.userVpc.vpcCidrBlock,
        routeTableId,
        vpcPeeringConnectionId: connection.ref,
      });
    });

    if (props.userVpc.publicSubnets) {
      props.userVpc.publicSubnets.forEach(({ routeTable: { routeTableId } }, index) => {
        new ec2.CfnRoute(this, 'RouteFromPublicSubnetOfUserVpcToLodgeVpc' + index, {
          destinationCidrBlock: props.lodgeVpc.vpcCidrBlock,
          routeTableId,
          vpcPeeringConnectionId: connection.ref,
        });
      });
    } 
    if (props.userVpc.privateSubnets) {
      props.userVpc.privateSubnets.forEach(({ routeTable: { routeTableId } }, index) => {
        new ec2.CfnRoute(this, 'RouteFromPrivateSubnetOfUserVpcToLodgeVpc' + index, {
          destinationCidrBlock: props.lodgeVpc.vpcCidrBlock,
          routeTableId,
          vpcPeeringConnectionId: connection.ref,
        });
      });
    }
    if (props.userVpc.isolatedSubnets) {
      props.userVpc.publicSubnets.forEach(({ routeTable: { routeTableId } }, index) => {
        new ec2.CfnRoute(this, 'RouteFromIsolatedSubnetOfUserVpcToLodgeVpc' + index, {
          destinationCidrBlock: props.lodgeVpc.vpcCidrBlock,
          routeTableId,
          vpcPeeringConnectionId: connection.ref,
        });
      });
    }
  }
}

module.exports = { PeeringStack }