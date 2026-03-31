const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { S3Client } = require("@aws-sdk/client-s3");

const region = process.env.AWS_REGION || "ap-southeast-1";

const awsConfig = {
  region
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  awsConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  };
}

const dynamoClient = new DynamoDBClient(awsConfig);
const s3Client = new S3Client(awsConfig);

module.exports = {
  dynamoClient,
  s3Client
};
