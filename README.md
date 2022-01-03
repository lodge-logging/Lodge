![lodge-logo](https://github.com/lodge-logging/Lodge-CLI/blob/main/img/Lodge_logo_color.png)

![shields.io npm version badge](https://img.shields.io/npm/v/lodge-cli)
![shields.io npm license badge](https://img.shields.io/npm/l/lodge-cli)
![shields.io custom website link badge](https://img.shields.io/static/v1?label=website&message=lodge-logging.github.io&color=blue)

## Overview

This is the CDK application for Lodge. 


[For more information about how to install and deploy Lodge.](https://github.com/lodge-logging/Lodge-CLI)

[For more information about how to use Lodge.](https://github.com/lodge-logging/Lodge-Dashboard)


## The Team

**[Sam Clark](https://www.linkedin.com/in/sam-clark-0aa74390/)** _Software Engineer_ Dallas, TX

**[Rana Deeb](https://www.linkedin.com/in/rana-deeb/)** _Software Engineer_ San Francisco, CA

**[Regina Donovan](https://www.linkedin.com/in/regina-donovan-82242040/)** _Software Engineer_ Atlanta, GA

**[Justin Lo](https://www.linkedin.com/in/justinkevinheilo/)** _Software Engineer_ Vancouver, BC

---

## Table of Contents

- [Lodge Architectural Overview](https://github.com/lodge-logging/Lodge#lodge-architectural-overview)
- [Kafka](https://github.com/lodge-logging/Lodge#kafka)
- [Logstash](https://github.com/lodge-logging/Lodge#logstash)
- [Elasticsearch and S3](https://github.com/lodge-logging/Lodge#elasticsearch-and-s3)
- [Kibana](https://github.com/lodge-logging/Lodge#kibana)
- [Lodge Dashboard](https://github.com/lodge-logging/Lodge#lodge-dashboard)
- [Bastion Host](https://github.com/lodge-logging/Lodge#bastion-host)

---

## Lodge Architectural Overview

![lodge-architectural-diagram](https://github.com/lodge-logging/Lodge/blob/main/img/lodge-architectural-diagram.png)

Filebeat for shipping logs to Lodge, Kafka for buffering the logs, Logstash for parsing, transforming, and indexing the logs, Elasticsearch and S3 for storing the logs, and the Lodge Dashboard for managing Kafka, re-indexing archived logs back into Elasticsearch from S3, and using Kibana, which is there to query and visualize the logs in Elasticsearch.

---

## Kafka

![lodge-kafka](https://github.com/lodge-logging/Lodge/blob/main/img/lodge-kafka.png)

Kafka is the first supporting component we’ve introduced. Logs and log volumes are unpredictable in nature. Following a production incident, and precisely when you need them the most, logs can suddenly surge and overwhelm your logging infrastructure. In order to protect Logstash and Elasticsearch against such data bursts, Lodge incorporated a buffering mechanism to act as message brokers to flatten the curve when there is bursty log traffic.

Kafka is usually deployed between the shipper and the indexer, acting as an entrypoint for the data being collected. 

---

## Logstash

![lodge-logstash](https://github.com/lodge-logging/Lodge/blob/main/img/lodge-logstash.png)

After Kafka we have Logstash, to supplement what was mentioned before about Logstash, Logstash is a server-side real-time data-processing pipeline that ingests data from multiple sources simultaneously, transforms it, and then sends it to a “stash” like Elasticsearch and Amazon S3. 

In the case of Lodge, Logstash first ingests log data from specific Kafka topics, performs parsing and transformation, and sends logs over to two different storages in Lodge.
 

---

## Elasticsearch and S3

![lodge-elasticsearch-and-s3](https://github.com/lodge-logging/Lodge/blob/main/img/lodge-elasticsearch-and-s3.png)

This leads us to the storage layer which consists of Elasticsearch and Amazon S3. We’ve already talked about Elasticsearch, but as a recap -  Elasticsearch is a distributed, RESTful search and analytics engine that centralizes your log data so you can search, index, and analyze log data of all shapes and sizes.  

One might notice that now we also have the Amazon S3 bucket receiving data from Logstash. Storing logs in Elasticsearch can be very costly, both in terms of cost / monetary value as well as in terms of engineering hours you have to put in to retrieve them back. S3 is supporting Elasticsearch here by acting as a backup for data currently in Elasticsearch as well as long-term archive for data no longer needed in Elasticsearch. 

---

## Kibana

![lodge-kibana](https://github.com/lodge-logging/Lodge/blob/main/img/lodge-kibana.png)

Kibana is the next Elastic stack component we use in Lodge. Kibana is a UI that is built on top of the Elastic Stack. It allows you to visualize and analyze data within Elasticsearch. 

The interface is accessible through a browser and the lodge dashboard with a built in web server. The kibana server communicates with an elasticsearch cluster to retrieve its data. Kibana also stores all of its data within Elasticsearch indices, this is convenient because we don’t have to manage a database for these data and handle things like backup.

---

## Lodge Dashboard

![lodge-dashboard](https://github.com/lodge-logging/Lodge/blob/main/img/lodge-dashboard.png)

Finally, we have the Lodge Dashboard, which serves as a unified dashboard for using Kibana and Lodge Restore, downloading Filebeat configurations for different supported log types, and managing Kafka and zookeeper clusters. 

This is the high level overview of what the Lodge Dashboard looks like.

---

## Bastion Host

![lodge-bastion-host](https://github.com/lodge-logging/Lodge/blob/main/img/lodge-bastion-host.png)

PENDING...

---



