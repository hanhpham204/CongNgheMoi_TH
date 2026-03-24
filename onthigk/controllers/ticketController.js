const docClient = require("../config/aws");
const uploadToS3 = require("../config/s3");

const {
  ScanCommand,
  PutCommand,
  DeleteCommand,
  UpdateCommand,
  GetCommand
} = require("@aws-sdk/lib-dynamodb");

const validateTicket = require("../utils/validation");

const TABLE = "EventTickets";

function getTicketStatus(quantity) {

  if (quantity <= 0) return "Hết vé";

  if (quantity <= 10) return "Sắp hết";

  return "Còn vé";
}

function calculateRevenue(price, sold) {
  return Number(price) * Number(sold);
}

exports.index = async (req, res) => {

  const result = await docClient.send(
    new ScanCommand({ TableName: TABLE })
  );

  res.render("index", { tickets: result.Items || [] });
};

exports.showAdd = (req, res) => {
  res.render("add", { errors: [], oldData: {} });
};

exports.createTicket = async (req, res) => {

  const errors = validateTicket(req.body);

  if (errors.length > 0) {
    return res.render("add", { errors, oldData: req.body });
  }

  let imageUrl = "";

  if (req.file) {
    imageUrl = await uploadToS3(req.file);
  }

  const quantity = Number(req.body.quantity);
  const price = Number(req.body.price);

  const ticket = {
    ticketId: req.body.ticketId,
    eventName: req.body.eventName,
    price,
    quantity,
    status: getTicketStatus(quantity),   // 👈 business logic
    revenue: calculateRevenue(price, 0), // ví dụ tính doanh thu
    imageUrl
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE,
      Item: ticket
    })
  );

  res.redirect("/");
};

exports.showEdit = async (req, res) => {

  const ticketId = req.params.id;

  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE,
      Key: { ticketId }
    })
  );

  res.render("edit", {
    ticket: result.Item,
    errors: []
  });
};
exports.updateTicket = async (req, res) => {

  const ticketId = req.params.id;

  const errors = validateTicket(req.body);

  if (errors.length > 0) {
    return res.render("edit", {
      errors,
      ticket: req.body
    });
  }

  let imageUrl = req.body.oldImage;

  if (req.file) {
    imageUrl = await uploadToS3(req.file);
  }

  const price = Number(req.body.price);
  const quantity = Number(req.body.quantity);

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { ticketId },

      UpdateExpression:
        "SET eventName=:eventName, price=:price, quantity=:quantity, imageUrl=:imageUrl",

      ExpressionAttributeValues: {
        ":eventName": req.body.eventName,
        ":price": price,
        ":quantity": quantity,
        ":imageUrl": imageUrl
      }
    })
  );

  res.redirect("/");
};
exports.deleteTicket = async (req, res) => {

  const ticketId = req.params.id;

  await docClient.send(
    new DeleteCommand({
      TableName: TABLE,
      Key: { ticketId }
    })
  );

  res.redirect("/");
};

exports.search = async (req, res) => {

  const keyword = req.query.keyword || "";

  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE,
      FilterExpression: "contains(eventName, :kw)",
      ExpressionAttributeValues: {
        ":kw": keyword
      }
    })
  );

  res.render("index", { tickets: result.Items || [] });
};