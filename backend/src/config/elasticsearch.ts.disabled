import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

dotenv.config();

const elasticsearchClient = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  auth: process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD
    ? {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD,
      }
    : undefined,
  maxRetries: 5,
  requestTimeout: 60000,
  sniffOnStart: true,
});

export default elasticsearchClient;