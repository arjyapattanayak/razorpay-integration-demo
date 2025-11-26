import React, { Fragment, useEffect, useState } from 'react'
import Card from './Card'
import Navbar from './Navbar'
import { course } from "../../courseData/courseData"
import axios from 'axios'

const Fetch = () => {

    const [data, setData] = useState([])

    const fdata = () => {
        setData(course)
    }
    useEffect(()=>{fdata() },[])
    
    //! load razorpay script- 
    const loadScript = (src) => {
        return new Promise((resolve) => {
            const script = document.createElement("script")
            script.src = src
            script.onload = () => {
                resolve(true)
            }
            script.onerror = () => {
                resolve(false)
            }
            document.body.appendChild(script)
        })
    }

    useEffect(() => {
        loadScript("https://checkout.razorpay.com/v1/checkout.js")
    }, [])


    //! One tyme Payment Handler-
    const onPayment = async (price, itemName) => {
        //create order
        try {
            const options = {
                courseId: 1,
                amount: price
            }

            const res = await axios.post("http://localhost:4000/api/createOrder", options)
            const orderData = res.data

            console.log(orderData)

            const paymentObject = new window.Razorpay({
                key: import.meta.env.VITE_RAZORPAY_KEY,
                amount: orderData.amount,
                currency: orderData.currency,
                order_id: orderData.id,
                name: "Course Payment",
                description: `Payment for ${itemName}`,
                handler: function (response) {
                    console.log("Payment Response:", response);

                    const options2 = {
                        order_id: response.razorpay_order_id,
                        payment_id: response.razorpay_payment_id,
                        signature: response.razorpay_signature
                    }
                    
                    console.log("Sending verification request:", options2);
                    
                    axios.post("http://localhost:4000/api/verifyPayment", options2).then((verifyRes) => {
                        console.log("Verification Response:", verifyRes.data);
                        if (verifyRes.data.success) {
                            alert("Payment successful!")
                        } else {
                            alert("Payment verification failed: " + (verifyRes.data.message || "Unknown error"))
                        }
                    }).catch((error) => {
                        console.error("Verification error:", error);
                        if (error.response) {
                            console.error("Error response:", error.response.data);
                            alert("Payment verification failed: " + (error.response.data?.message || error.message))
                        } else {
                            alert("Payment verification failed: Network error")
                        }
                    })
                },
                modal: {
                    ondismiss: function() {
                        console.log("Payment modal closed by user");
                        alert("Payment cancelled");
                    }
                },
                prefill: {
                    name: "Customer Name",
                    email: "customer@example.com",
                    contact: "9999999999"
                },
                theme: {
                    color: "#3399cc"
                }
            })
            
            paymentObject.on('payment.failed', function (response) {
                console.error("Payment failed:", response);
                alert("Payment failed: " + (response.error.description || "Unknown error"));
            });
            
            paymentObject.open();
        } catch (error) {
            console.log(error);
            alert("Failed to initialize payment. Please try again.")
        }
    }

    //! Subscription Handler-
    const buySubscription = async (itemName,planId) => {
        try {
            // Validate planId
            if (planId !== "monthly" && planId !== "yearly") {
                alert("Invalid subscription plan. Please select 'monthly' or 'yearly'.")
                return
            }

            // Create subscription on backend
            const courseId = 1; // You can make this dynamic based on your needs
            const subscriptionPayload = {
                courseId: courseId,
                planId: planId
            }

            console.log("Creating subscription with payload:", subscriptionPayload)

            const res = await axios.post("http://localhost:4000/api/buySubscription", subscriptionPayload)
            
            if (!res.data.success) {
                alert("Failed to create subscription: " + (res.data.message || "Unknown error"))
                return
            }

            const subscriptionData = res.data.subscription
            console.log("Subscription created:", subscriptionData)

            // Initialize Razorpay subscription checkout
            const subscriptionObject = new window.Razorpay({
                key: import.meta.env.VITE_RAZORPAY_KEY,
                subscription_id: subscriptionData.id,
                name: "Course Subscription",
                description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} subscription for ${itemName}`,
                handler: function (response) {
                    console.log("Subscription Response:", response);

                    const verificationData = {
                        subscription_id: response.razorpay_subscription_id,
                        payment_id: response.razorpay_payment_id,
                        signature: response.razorpay_signature
                    }
                    
                    console.log("Sending subscription verification request:", verificationData);
                    
                    axios.post("http://localhost:4000/api/verifySubscription", verificationData).then((verifyRes) => {
                        console.log("Subscription Verification Response:", verifyRes.data);
                        if (verifyRes.data.success) {
                            alert(`🎉 ${planId.charAt(0).toUpperCase() + planId.slice(1)} subscription activated successfully for ${itemName}!`)
                            // You can add additional logic here like updating UI or redirecting
                        } else {
                            alert("Subscription verification failed: " + (verifyRes.data.message || "Unknown error"))
                        }
                    }).catch((error) => {
                        console.error("Subscription verification error:", error);
                        if (error.response) {
                            console.error("Error response:", error.response.data);
                            alert("Subscription verification failed: " + (error.response.data?.message || error.message))
                        } else {
                            alert("Subscription verification failed: Network error")
                        }
                    })
                },
                modal: {
                    ondismiss: function() {
                        console.log("Subscription modal closed by user");
                        alert("Subscription cancelled");
                    }
                },
                prefill: {
                    name: "Customer Name",
                    email: "customer@example.com",
                    contact: "9999999999"
                },
                theme: {
                    color: "#3399cc"
                },
                notes: {
                    courseId: courseId.toString(),
                    plan: planId,
                    itemName: itemName
                }
            })

            // Handle subscription payment failure
            subscriptionObject.on('payment.failed', function (response) {
                console.error("Subscription payment failed:", response);
                alert("Subscription payment failed: " + (response.error?.description || "Unknown error"));
            })

            // Handle subscription cancellation
            subscriptionObject.on('subscription.cancelled', function (response) {
                console.log("Subscription cancelled:", response);
                alert("Subscription was cancelled")
            })

            // Open subscription checkout
            subscriptionObject.open();

        } catch (error) {
            console.error("Subscription initialization error:", error);
            if (error.response) {
                console.error("Error response:", error.response.data);
                alert("Subscription Error: " + (error.response.data?.message || error.response.data?.error || error.message))
            } else {
                alert("Subscription Error: " + (error.message || "Failed to initialize subscription. Please try again."))
            }
        }
    }

    return (
        <div className='main'>
            <Navbar/>
            {
                data.length > 0 ? data.map((ele, index) => {
                    return (
                        <Fragment key={index}>
                            <Card data={ele} function={buySubscription} />
                        </Fragment>
                    )
                }) : ""
            }

        </div>
    )
}

export default Fetch
