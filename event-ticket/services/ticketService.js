const AWS = require("../config/aws")
const {v4: uuidv4} = require('uuid')

const dynamo = new AWS.DynamoDB.DocumentClient();
const TABLE = 'EventTickets'

exports.getAll = async () => {
    const data = await dynamo.scan({TableName: TABLE}).promise();
    return data.Items || []
}

exports.create = async (item) => {
    item.ticketId = uuidv4()
    item.createAt = new Date().toISOString();

    await dynamo.put({
        TableName: TABLE,
        Item: item
    }).promise();
}

exports.getById = async (id) => {
    const data = await dynamo.get({
        TableName: TABLE,
        Key: {ticketId: id}
    }).promise()
    return data.Item
}

exports.update = async (id, item) => {
    item.ticketId = id
    await dynamo.put({
        TableName: TABLE,
        Item: item
    }).promise()
}

exports.delete = async (id) => {
    await dynamo.delete({
        TableName: TABLE,
        Key: {ticketId: id}
    }).promise()
}