require("dotenv").config();
const AWS = require("aws-sdk");

const dynamoDB = new AWS.DynamoDB({
  endpoint: process.env.DYNAMODB_ENDPOINT,
  region: process.env.AWS_REGION,
});

const params = {
  TableName: process.env.TABLE_NAME,
  KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
  AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
  BillingMode: "PAY_PER_REQUEST",
};

dynamoDB.createTable(params, (err, data) => {
  if (err) console.error(err);
  else console.log("Table created:", data);
});