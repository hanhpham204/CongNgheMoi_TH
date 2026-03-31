const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { dynamoClient } = require("./aws");

const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true
  }
});

const HOTEL_ROOMS_TABLE = process.env.DYNAMODB_TABLE_NAME || "HotelRooms";

module.exports = {
  docClient,
  HOTEL_ROOMS_TABLE
};
