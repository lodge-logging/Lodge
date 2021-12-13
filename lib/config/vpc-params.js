module.exports = {
  ports: {
    internal: {
      Elasticsearch: [9300, 9400],
      Zookeeper: [2888, 3888],
    },
    external: {
      Kafka: 9092,
      Kibana: 5601,
      Elasticsearch: [9200, 9300],
      Zookeeper: 2181,
      ZooManager: 8001,
      Kowl: 8080,
      s3Dashboard: 3000,
      SSH: 22,
    },
  },
};
