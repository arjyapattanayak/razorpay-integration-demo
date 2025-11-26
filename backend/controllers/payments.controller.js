const { createRazorpayInstance } = require("../config/razorpay.config");
const crypto =require("crypto");
const dotenv=require("dotenv")
dotenv.config();

const razorypayInstance=createRazorpayInstance()


//! Payment or One Time Payment Model-

//todo create order -
exports.createOrder=async(req,res)=>{
    //! donot accept amount from client
    const {courseId,amount}=req.body;

    // checks
    if(!courseId || !amount){
        return res.status(400).json({
success:false,
message:"course id and amount are required"
        })
    }

    // courseId is used to fetch course data including price from db

    const options={
        amount:amount*100, //amount in smallest currency unit  
        currency:"INR",
        receipt:`receipt_order_1`,
    }
    try {
        razorypayInstance.orders.create(options,(err,order)=>{
if(err){
     return res.status(500).json({
            success:false,
            message:"Something went wrong",
})
} 
return res.status(200).json(order)
})     
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Something went wrong while creating order",
        })
    }
}

 //todo verify payment-
exports.verifyPayment=async(req,res)=>{
    try {
        const {order_id,payment_id ,signature}=req.body;

        // Validate required fields
        if(!order_id || !payment_id || !signature){
            return res.status(400).json({
                success:false,
                message:"order_id, payment_id, and signature are required"
            })
        }

        const secret= process.env.RAZORPAY_KEY_SECRET;

        if(!secret){
            console.error("RAZORPAY_KEY_SECRET is not set in environment variables");
            return res.status(500).json({
                success:false,
                message:"Server configuration error"
            })
        }

        // create crypto hmac object
        const hmac=crypto.createHmac("sha256",secret)

        hmac.update(order_id+"|"+payment_id)

        const generatedSignature=hmac.digest("hex")

        console.log("Verification attempt:");
        console.log("Order ID:", order_id);
        console.log("Payment ID:", payment_id);
        console.log("Received Signature:", signature);
        console.log("Generated Signature:", generatedSignature);
        console.log("Signatures match:", generatedSignature===signature);

        if(generatedSignature===signature){
            // db operations can be done here like store payment details
            return res.status(200).json({
                success:true,
                message:"payment verified",
            })
        }else{
            return res.status(400).json({
                success:false,
                message:"payment not verified - signature mismatch",
            })
        }
    } catch (error) {
        console.error("Error in verifyPayment:", error);
        return res.status(500).json({
            success:false,
            message:"Internal server error during verification"
        })
    }
}
//! subscription or Recurring Payment Model-

//todo create subscription -

exports.buySubscription=async(req,res)=>{
    try {
        const {courseId,planId}=req.body;

        // Validate required fields
        if(!courseId || !planId){
            return res.status(400).json({
                success:false,
                message:"courseId and planId are required"
            })
        }

        const monthly_plan_id=process.env.MONTHLY_PLAN_ID;
        const yearly_plan_id=process.env.YEARLY_PLAN_ID;

        // Validate environment variables
        if(!monthly_plan_id || !yearly_plan_id){
            console.error("MONTHLY_PLAN_ID or YEARLY_PLAN_ID is not set in environment variables");
            return res.status(500).json({
                success:false,
                message:"Server configuration error"
            })
        }

        let subscription;

        if(planId==="monthly"){
            subscription = await razorypayInstance.subscriptions.create({
                plan_id:monthly_plan_id,
                customer_notify:1,
                total_count:12,
            })
            return res.status(200).json({
                success:true,
                subscription,
            })
        }
        else if(planId==="yearly"){
            subscription = await razorypayInstance.subscriptions.create({
                plan_id:yearly_plan_id,
                customer_notify:1,
                total_count:1,
            })
            return res.status(200).json({
                success:true,
                subscription,
            })
        }
        else{
            return res.status(400).json({
                success:false,
                message:"Invalid planId."
            })
        }
    } catch (error) {
        console.error("Error in buySubscription:", error);
        return res.status(500).json({
            success:false,
            message:"Something went wrong while creating subscription",
            error: error.message
        })
    }
}

//todo verify subscription -

exports.verifySubscription=async(req,res)=>{
    try {
        const {subscription_id,payment_id,signature}=req.body;

        // Validate required fields
        if(!subscription_id || !payment_id || !signature){
            return res.status(400).json({
                success:false,
                message:"subscription_id, payment_id, and signature are required"
            })
        }

        const secret= process.env.RAZORPAY_KEY_SECRET;

        if(!secret){
            console.error("RAZORPAY_KEY_SECRET is not set in environment variables");
            return res.status(500).json({
                success:false,
                message:"Server configuration error"
            })
        }

        // create crypto hmac object
        const hmac=crypto.createHmac("sha256",secret)

        // For subscriptions, signature is generated using subscription_id|payment_id
        hmac.update(payment_id+"|"+subscription_id)

        const generatedSignature=hmac.digest("hex")

        console.log("Subscription Verification attempt:");
        console.log("Subscription ID:", subscription_id);
        console.log("Payment ID:", payment_id);
        console.log("Received Signature:", signature);
        console.log("Generated Signature:", generatedSignature);
        console.log("Signatures match:", generatedSignature===signature);

        if(generatedSignature===signature){
            // db operations can be done here like store subscription payment details
            return res.status(200).json({
                success:true,
                message:"subscription payment verified",
            })
        }else{
            return res.status(400).json({
                success:false,
                message:"subscription payment not verified - signature mismatch",
            })
        }
    } catch (error) {
        console.error("Error in verifySubscription:", error);
        return res.status(500).json({
            success:false,
            message:"Internal server error during subscription verification"
        })
    }
}
