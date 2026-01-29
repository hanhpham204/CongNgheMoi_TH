const db = require("../config/dynamodb");
const {
  ScanCommand,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");

module.exports = {
  getAll: async () => {
    const data = await db.send(new ScanCommand({ TableName: process.env.DYNAMO_TABLE }));
    return data.Items;
  },

  create: async (product) => {
    await db.send(
      new PutCommand({ TableName: process.env.DYNAMO_TABLE, Item: product })
    );
  },

  getById: async (id) => {
    const data = await db.send(
      new GetCommand({ TableName: process.env.DYNAMO_TABLE, Key: { id } })
    );
    return data.Item;
  },

  update: async (id, updates) => {
    const keys = Object.keys(updates || {});
    if (keys.length === 0) return;

    const expr = keys.map((k) => `#${k} = :${k}`).join(", ");
    const exprAttrNames = Object.fromEntries(keys.map((k) => [`#${k}`, k]));
    const exprAttrValues = Object.fromEntries(keys.map((k) => [`:${k}`, updates[k]]));

    await db.send(
      new UpdateCommand({
        TableName: process.env.DYNAMO_TABLE,
        Key: { id },
        UpdateExpression: `SET ${expr}`,
        ExpressionAttributeNames: exprAttrNames,
        ExpressionAttributeValues: exprAttrValues,
      })
    );
  },

  delete: async (id) => {
    await db.send(new DeleteCommand({ TableName: process.env.DYNAMO_TABLE, Key: { id } }));
  },
};
