const express = require("express");
const router=express.Router()

const { createOrder, verifyPayment } = require("../controllers/payments.controller");

router.post("/createOrder",createOrder)
router.post("/verifyPayment",verifyPayment)

module.exports=router;