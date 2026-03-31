const crypto = require("crypto");
const { Upload } = require("@aws-sdk/lib-storage");
const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const {
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand
} = require("@aws-sdk/lib-dynamodb");
const { s3Client } = require("../config/aws");
const { docClient, HOTEL_ROOMS_TABLE } = require("../config/dynamodb");

const ALLOWED_TYPES = ["Standard", "Deluxe", "Suite"];
const ALLOWED_STATUS = ["Available", "Occupied", "Maintenance"];

function isJsonRequest(req) {
  const accept = req.get("accept") || "";
  const requestedWith = req.get("x-requested-with") || "";
  return accept.includes("application/json") || requestedWith === "XMLHttpRequest";
}

function sendResponse(req, res, successMessage, payload = {}) {
  if (isJsonRequest(req)) {
    return res.json({
      message: successMessage,
      ...payload
    });
  }
  return res.redirect(`/rooms?success=${encodeURIComponent(successMessage)}`);
}

function sendError(req, res, status, errorMessage) {
  if (isJsonRequest(req)) {
    return res.status(status).json({ message: errorMessage });
  }
  const backUrl = req.get("referer") || "/rooms";
  const separator = backUrl.includes("?") ? "&" : "?";
  return res.redirect(`${backUrl}${separator}error=${encodeURIComponent(errorMessage)}`);
}

function normalizeNumber(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? NaN : num;
}

function validateNewRoom(body) {
  const errors = [];
  const price = normalizeNumber(body.pricePerNight);
  const cap = normalizeNumber(body.capacity);

  if (!body.roomName || !body.roomName.trim()) {
    errors.push("roomName không được rỗng.");
  }
  if (!(price > 0)) {
    errors.push("pricePerNight phải > 0.");
  }
  if (!(cap >= 1 && cap <= 10)) {
    errors.push("capacity phải từ 1 đến 10.");
  }
  if (!ALLOWED_TYPES.includes(body.roomType)) {
    errors.push("roomType phải thuộc Standard, Deluxe, Suite.");
  }
  if (!ALLOWED_STATUS.includes(body.status)) {
    errors.push("status phải thuộc Available, Occupied, Maintenance.");
  }

  return { errors, price, cap };
}

function validateUpdate(body) {
  const errors = [];
  const updates = {};

  if (body.pricePerNight !== undefined && body.pricePerNight !== "") {
    const price = normalizeNumber(body.pricePerNight);
    if (!(price > 0)) {
      errors.push("pricePerNight phải > 0.");
    } else {
      updates.pricePerNight = price;
    }
  }

  if (body.capacity !== undefined && body.capacity !== "") {
    const cap = normalizeNumber(body.capacity);
    if (!(cap >= 1 && cap <= 10)) {
      errors.push("capacity phải từ 1 đến 10.");
    } else {
      updates.capacity = cap;
    }
  }

  if (body.status !== undefined && body.status !== "") {
    if (!ALLOWED_STATUS.includes(body.status)) {
      errors.push("status phải thuộc Available, Occupied, Maintenance.");
    } else {
      updates.status = body.status;
    }
  }

  return { errors, updates };
}

async function uploadRoomImage(file) {
  if (!file) return "";
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) throw new Error("Thiếu cấu hình S3_BUCKET_NAME.");

  const key = `rooms/${Date.now()}-${crypto.randomUUID()}-${file.originalname}`;
  const uploader = new Upload({
    client: s3Client,
    params: {
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype
    }
  });

  await uploader.done();
  return `https://${bucket}.s3.${process.env.AWS_REGION || "ap-southeast-1"}.amazonaws.com/${key}`;
}

function extractS3KeyFromUrl(imageUrl, bucket) {
  if (!imageUrl || !bucket) return null;

  try {
    const parsed = new URL(imageUrl);
    const host = parsed.hostname || "";
    const isBucketHost =
      host === `${bucket}.s3.amazonaws.com` ||
      host.startsWith(`${bucket}.s3.`);

    if (!isBucketHost) return null;
    const key = (parsed.pathname || "").replace(/^\/+/, "");
    return key || null;
  } catch (_err) {
    return null;
  }
}

function buildFilterQuery({ q, roomType, status }) {
  const filterParts = [];
  const expressionNames = {};
  const expressionValues = {};

  if (q) {
    filterParts.push("contains(#roomName, :q)");
    expressionNames["#roomName"] = "roomName";
    expressionValues[":q"] = q;
  }
  if (roomType) {
    filterParts.push("#roomType = :roomType");
    expressionNames["#roomType"] = "roomType";
    expressionValues[":roomType"] = roomType;
  }
  if (status) {
    filterParts.push("#status = :status");
    expressionNames["#status"] = "status";
    expressionValues[":status"] = status;
  }

  return {
    FilterExpression: filterParts.length ? filterParts.join(" AND ") : undefined,
    ExpressionAttributeNames: Object.keys(expressionNames).length
      ? expressionNames
      : undefined,
    ExpressionAttributeValues: Object.keys(expressionValues).length
      ? expressionValues
      : undefined
  };
}

function statusClass(status) {
  if (status === "Available") return "status-available";
  if (status === "Occupied") return "status-occupied";
  return "status-maintenance";
}

async function getRoomById(roomId) {
  const data = await docClient.send(
    new GetCommand({
      TableName: HOTEL_ROOMS_TABLE,
      Key: { roomId }
    })
  );
  return data.Item;
}

exports.getRoomsPage = async (req, res) => {
  try {
    const { q = "", roomType = "", status = "" } = req.query;
    const filter = buildFilterQuery({
      q: q.trim(),
      roomType: roomType.trim(),
      status: status.trim()
    });

    const data = await docClient.send(
      new ScanCommand({
        TableName: HOTEL_ROOMS_TABLE,
        ...filter
      })
    );

    const rooms = (data.Items || []).map((room) => ({
      ...room,
      revenue3Nights: (Number(room.pricePerNight) || 0) * 3,
      statusClass: statusClass(room.status)
    }));

    const availableCountByType = ALLOWED_TYPES.reduce((acc, type) => {
      acc[type] = rooms.filter(
        (room) => room.roomType === type && room.status === "Available"
      ).length;
      return acc;
    }, {});

    res.render("rooms/index", {
      rooms,
      allowedTypes: ALLOWED_TYPES,
      allowedStatus: ALLOWED_STATUS,
      filters: { q, roomType, status },
      success: req.query.success || "",
      error: req.query.error || "",
      availableCountByType
    });
  } catch (error) {
    console.error(error);
    return sendError(req, res, 500, "Không thể tải danh sách phòng.");
  }
};

exports.getAddRoomPage = (req, res) => {
  res.render("rooms/add", {
    allowedTypes: ALLOWED_TYPES,
    allowedStatus: ALLOWED_STATUS,
    error: req.query.error || ""
  });
};

exports.getEditRoomPage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await getRoomById(roomId);
    if (!room) {
      return sendError(req, res, 404, "Không tìm thấy phòng cần sửa.");
    }

    res.render("rooms/edit", {
      room,
      allowedStatus: ALLOWED_STATUS,
      error: req.query.error || ""
    });
  } catch (error) {
    console.error(error);
    return sendError(req, res, 500, "Không thể tải trang chỉnh sửa.");
  }
};

exports.createRoom = async (req, res) => {
  try {
    const { errors, price, cap } = validateNewRoom(req.body);
    if (errors.length) return sendError(req, res, 400, errors.join(" "));

    const imageUrl = await uploadRoomImage(req.file);
    const roomId = crypto.randomUUID();

    const newRoom = {
      roomId,
      roomName: req.body.roomName.trim(),
      roomType: req.body.roomType,
      pricePerNight: price,
      capacity: cap,
      status: req.body.status,
      imageUrl,
      createdAt: new Date().toISOString()
    };

    await docClient.send(
      new PutCommand({
        TableName: HOTEL_ROOMS_TABLE,
        Item: newRoom,
        ConditionExpression: "attribute_not_exists(roomId)"
      })
    );

    return sendResponse(req, res, "Thêm phòng thành công.", { room: newRoom });
  } catch (error) {
    console.error(error);
    return sendError(req, res, 500, "Thêm phòng thất bại.");
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { errors, updates } = validateUpdate(req.body);
    if (errors.length) return sendError(req, res, 400, errors.join(" "));

    if (req.file) {
      updates.imageUrl = await uploadRoomImage(req.file);
    }

    if (!Object.keys(updates).length) {
      return sendError(req, res, 400, "Không có dữ liệu cần cập nhật.");
    }

    const updateKeys = Object.keys(updates);
    const expressionNames = {};
    const expressionValues = {};
    const setParts = [];

    updateKeys.forEach((key) => {
      expressionNames[`#${key}`] = key;
      expressionValues[`:${key}`] = updates[key];
      setParts.push(`#${key} = :${key}`);
    });

    const result = await docClient.send(
      new UpdateCommand({
        TableName: HOTEL_ROOMS_TABLE,
        Key: { roomId },
        UpdateExpression: `SET ${setParts.join(", ")}`,
        ExpressionAttributeNames: expressionNames,
        ExpressionAttributeValues: expressionValues,
        ConditionExpression: "attribute_exists(roomId)",
        ReturnValues: "ALL_NEW"
      })
    );

    return sendResponse(req, res, "Cập nhật phòng thành công.", {
      room: result.Attributes
    });
  } catch (error) {
    console.error(error);
    if (error.name === "ConditionalCheckFailedException") {
      return sendError(req, res, 404, "Không tìm thấy phòng cần cập nhật.");
    }
    return sendError(req, res, 500, "Cập nhật phòng thất bại.");
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await getRoomById(roomId);
    if (!room) {
      return sendError(req, res, 404, "Không tìm thấy phòng cần xóa.");
    }

    const bucket = process.env.S3_BUCKET_NAME;
    const imageKey = extractS3KeyFromUrl(room.imageUrl, bucket);

    if (imageKey) {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: imageKey
        })
      );
    }

    await docClient.send(
      new DeleteCommand({
        TableName: HOTEL_ROOMS_TABLE,
        Key: { roomId },
        ConditionExpression: "attribute_exists(roomId)"
      })
    );

    return sendResponse(req, res, "Xóa phòng thành công.");
  } catch (error) {
    console.error(error);
    return sendError(req, res, 500, "Xóa phòng thất bại.");
  }
};
