const { docClient, s3 } = require("../config/aws")

const {
 ScanCommand,
 PutCommand,
 DeleteCommand,
 UpdateCommand,
 GetCommand
} = require("@aws-sdk/lib-dynamodb")

const {
 PutObjectCommand,
 DeleteObjectCommand
} = require("@aws-sdk/client-s3")

const multer = require("multer")
const { v4: uuid } = require("uuid")

const upload = multer({ storage: multer.memoryStorage() })


/* =========================
LIST BOOKS + SEARCH + FILTER
========================= */

exports.listBooks = async (req,res)=>{

 const search=req.query.search||""
 const category=req.query.category||""

 const data=await docClient.send(new ScanCommand({
  TableName:process.env.DYNAMO_TABLE
 }))

 let books=data.Items||[]

 if(search){
  books=books.filter(b=>
   b.title.toLowerCase().includes(search.toLowerCase()))
 }

 if(category){
  books=books.filter(b=>b.category===category)
 }

 books=books.map(b=>{
  b.inventoryValue=b.price*b.unit_in_stock
  return b
 })

 res.render("index",{
  books,
  message:req.query.message||""
 })
}


/* =========================
SHOW ADD PAGE
========================= */

exports.showAdd=(req,res)=>{

 res.render("add",{
  errors:{},
  old:{}
 })

}


/* =========================
SHOW EDIT PAGE
========================= */

exports.showEdit=async(req,res)=>{

 const data=await docClient.send(new GetCommand({

  TableName:process.env.DYNAMO_TABLE,

  Key:{bookId:req.params.id}

 }))

 res.render("edit",{book:data.Item})

}


/* =========================
ADD BOOK + VALIDATION
========================= */

exports.addBook=[

 upload.single("image"),

 async(req,res)=>{

  const {title,category,price,unit_in_stock}=req.body

  let errors={}

  if(!title||title.trim()=="")
   errors.title="Title không được để trống"

  if(!category)
   errors.category="Category bắt buộc"

  if(!price||price<=0)
   errors.price="Price phải > 0"

  if(unit_in_stock<0)
   errors.unit_in_stock="Stock phải >=0"

  if(Object.keys(errors).length>0){

   return res.render("add",{
    errors,
    old:req.body
   })

  }

  const id=uuid()

  let imageUrl=""

  if(req.file){

   const key=id+".jpg"

   await s3.send(new PutObjectCommand({

    Bucket:process.env.S3_BUCKET,

    Key:key,

    Body:req.file.buffer,

    ContentType:req.file.mimetype

   }))

   imageUrl=
   `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`

  }

  const item={

   bookId:id,

   title,

   category,

   price:Number(price),

   unit_in_stock:Number(unit_in_stock),

   coverImageUrl:imageUrl,

   createdAt:new Date().toISOString()

  }

  await docClient.send(new PutCommand({

   TableName:process.env.DYNAMO_TABLE,

   Item:item

  }))

  res.redirect("/books?message=Thêm sách thành công")

 }

]


/* =========================
UPDATE BOOK
========================= */

exports.updateBook=[

 upload.single("image"),

 async(req,res)=>{

  const {price,unit_in_stock,category}=req.body

  const data=await docClient.send(new GetCommand({

   TableName:process.env.DYNAMO_TABLE,

   Key:{bookId:req.params.id}

  }))

  let imageUrl=data.Item.coverImageUrl

  if(req.file){

   const key=req.params.id+".jpg"

   await s3.send(new PutObjectCommand({

    Bucket:process.env.S3_BUCKET,

    Key:key,

    Body:req.file.buffer,

    ContentType:req.file.mimetype

   }))

   imageUrl=
   `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`

  }

  await docClient.send(new UpdateCommand({

   TableName:process.env.DYNAMO_TABLE,

   Key:{bookId:req.params.id},

   UpdateExpression:
   "set price=:p, unit_in_stock=:u, category=:c, coverImageUrl=:img",

   ExpressionAttributeValues:{
    ":p":Number(price),
    ":u":Number(unit_in_stock),
    ":c":category,
    ":img":imageUrl
   }

  }))

  res.redirect("/books?message=Sửa thành công")

 }

]


/* =========================
DELETE BOOK + DELETE S3
========================= */

exports.deleteBook=async(req,res)=>{

 const data=await docClient.send(new GetCommand({

  TableName:process.env.DYNAMO_TABLE,

  Key:{bookId:req.params.id}

 }))

 if(data.Item.coverImageUrl){

  const key=data.Item.coverImageUrl.split("/").pop()

  await s3.send(new DeleteObjectCommand({

   Bucket:process.env.S3_BUCKET,

   Key:key

  }))

 }

 await docClient.send(new DeleteCommand({

  TableName:process.env.DYNAMO_TABLE,

  Key:{bookId:req.params.id}

 }))

 res.redirect("/books?message=Xóa thành công")

}