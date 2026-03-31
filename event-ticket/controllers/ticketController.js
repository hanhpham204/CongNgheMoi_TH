const AWS = require('../config/aws')
const service = require('../services/ticketService')

const s3 = new AWS.S3();

async function uploadFile(file) {
    if (!file) return null;
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: Date.now() + '-' + file.originalname,
        Body: file.buffer,
        ContentType: file.mimetype,
    }
    const data = await s3.upload(params).promise();
    return data.Location;
}

function extractS3KeyFromUrl(imageUrl) {
    try {
        const url = new URL(imageUrl);
        let key = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
        const bucketName = process.env.S3_BUCKET_NAME;
        const bucketPrefix = `${bucketName}/`;

        if (key.startsWith(bucketPrefix)) {
            key = key.substring(bucketPrefix.length);
        }

        return key;
    } catch (error) {
        return "";
    }
}

async function deleteFileByUrl(fileUrl) {
    try {
        const key = extractS3KeyFromUrl(fileUrl);

        if (!key) {
            return;
        }

        await s3.deleteObject({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key,
        }).promise();
    } catch (err) {
        // optional: log only, do not break main flow
        console.error('Delete S3 file error:', err.message || err);
    }
}

function processData(data) {
    const quantity = Number(data.quantity);
    const price = Number(data.pricePerTicket);
    const errors = {};

    if (!quantity || quantity <= 0) {
        errors.quantity = "Quantity phải > 0";
    }

    if (!price || price <= 0) {
        errors.pricePerTicket = "Price phải > 0";
    }

    if (!data.eventDate) {
        errors.eventDate = "Event Date là bắt buộc";
    } else {
        const inputDate = new Date(data.eventDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (inputDate < now) {
            errors.eventDate = "Date phải >= hôm nay";
        }
    }

    if (Object.keys(errors).length > 0) {
        const err = new Error("Validation failed");
        err.validation = errors;
        throw err;
    }

    const totalAmount = quantity * price;
    let discount = 0;
    if (data.category === "VIP" && quantity >= 4) discount = 0.1;
    if (data.category === "VVIP" && quantity >= 2) discount = 0.15;

    const finalAmount = totalAmount * (1 - discount);

    return {
        ...data,
        quantity,
        pricePerTicket: price,
        totalAmount,
        finalAmount,
        label: discount > 0 ? "Được giảm giá" : "Không giảm giá",
    };
}

exports.list = async (req, res) => {
    let items = await service.getAll();
    const { keyword, status } = req.query

    if (keyword) {
        items = items.filter(i =>
            i.eventName.toLowerCase().includes(keyword.toLowerCase()) ||
            i.holderName.toLowerCase().includes(keyword.toLowerCase())
        )
    }

    if (status) {
        items = items.filter(i => i.status === status)
    }

    res.render("index", { items, keyword: keyword || '', status: status || '' })
}

exports.showAdd = (req, res) => {
    res.render('form', { item: {}, errors: {} });
};

exports.add = async (req, res) => {
    try {
        let imageUrl = null;
        if (req.file) imageUrl = await uploadFile(req.file);

        const data = processData({
            ...req.body,
            imageUrl
        });
        await service.create(data);
        res.redirect("/")
    } catch (err) {
        res.render('form', {
            item: { ...req.body },
            errors: err.validation || { general: err.message || "Có lỗi xảy ra" }
        });
    }
}

exports.update = async (req, res) => {
    try {
        let imageUrl = null;
        if (req.file) imageUrl = await uploadFile(req.file);
        const old = await service.getById(req.params.id)

        // nếu có ảnh mới thì xóa ảnh cũ trên S3
        if (imageUrl && old && old.imageUrl) {
            await deleteFileByUrl(old.imageUrl);
        }

        const data = processData({
            ...req.body,
            imageUrl: imageUrl || old.imageUrl
        })
        await service.update(req.params.id, data)
        res.redirect("/")
    } catch (err) {
        const old = await service.getById(req.params.id);
        res.render('form', {
            item: { ...old, ...req.body },
            errors: err.validation || { general: err.message || "Có lỗi xảy ra" }
        });
    }
}

exports.showEdit = async (req, res) => {
    const item = await service.getById(req.params.id)
    res.render('form', { item })
}

exports.delete = async (req, res) => {
    const old = await service.getById(req.params.id)

    // xóa ảnh trên S3 trước khi xóa bản ghi
    if (old && old.imageUrl) {
        await deleteFileByUrl(old.imageUrl);
    }

    await service.delete(req.params.id)
    res.redirect('/')
}

exports.detail = async (req, res) => {
    const item = await service.getById(req.params.id)
    res.render('detail', { item })
}