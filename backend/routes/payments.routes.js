const express = require("express");
const router=express.Router()

const { createOrder, verifyPayment, buySubscription , verifySubscription } = require("../controllers/payments.controller");

// for one time payment
router.post("/createOrder",createOrder)
router.post("/verifyPayment",verifyPayment)

// for subscription or recurring payment
router.post("/buySubscription",buySubscription)
router.post("/verifySubscription",verifySubscription)

module.exports=router;
