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


    //! Payment-
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

    return (
        <div className='main'>
            <Navbar/>
            {
                data.length > 0 ? data.map((ele, index) => {
                    return (
                        <Fragment key={index}>
                            <Card data={ele} function={onPayment} />
                        </Fragment>
                    )
                }) : ""
            }

        </div>
    )
}

export default Fetch
