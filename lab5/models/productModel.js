const dynamoDb = require("../config/dynamo");
require("dotenv").config();

const TABLE = process.env.TABLE_NAME;

exports.getAll = async () => {
  const params = { TableName: TABLE };
  const data = await dynamoDb.scan(params).promise();
  return data.Items;
};

exports.getById = async (id) => {
  const params = {
    TableName: TABLE,
    Key: { id },
  };
  const data = await dynamoDb.get(params).promise();
  return data.Item;
};

exports.create = async (product) => {
  const params = {
    TableName: TABLE,
    Item: product,
  };
  return dynamoDb.put(params).promise();
};

exports.update = async (id, data) => {
  const params = {
    TableName: TABLE,
    Key: { id },
    UpdateExpression: "set #n = :name, price = :price, url_image = :url",
    ExpressionAttributeNames: {
      "#n": "name",
    },
    ExpressionAttributeValues: {
      ":name": data.name,
      ":price": data.price,
      ":url": data.url_image,
    },
    ReturnValues: "UPDATED_NEW",
  };

  return dynamoDb.update(params).promise();
};

exports.remove = async (id) => {
  const params = {
    TableName: TABLE,
    Key: { id },
  };
  return dynamoDb.delete(params).promise();
};