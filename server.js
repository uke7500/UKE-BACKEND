// server.js
import express from "express";
import fetch from "node-fetch"; // npm i node-fetch
import cors from "cors";        // npm i cors
import dotenv from "dotenv";    // npm i dotenv
import nodemailer from "nodemailer"; // npm i nodemailer
import getShippingData from "./utils/getShippingData.js";
import getOrderData from "./utils/getOrderData.js";

dotenv.config();
const app = express();
// app.use(cors({ origin: process.env.FRONTEND_URL })); // Vite dev origin
app.use(cors({
    origin: process.env.FRONTEND_URL, // your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"], // allow content-type
    credentials: true
}));
app.use(express.json());



// --- Config ---
const PAYPAL_BASE = process.env.PAYPAL_BASE_URL; // from .env

// --- Helpers ---
async function getAccessToken() {
    const auth = Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString("base64");

    const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
    });

    if (!res.ok) {
        const t = await res.text();
        throw new Error(`Failed to get access token: ${res.status} ${t}`);
    }
    const data = await res.json();
    return data.access_token;
}

// --- Email Helper ---
async function sendEmail(to, subject, html) {
    const transporter = nodemailer.createTransport({
        service: "gmail", // you can change if using Outlook, etc.
        auth: {
            user: process.env.EMAIL_USER, // your email
            pass: process.env.EMAIL_PASS, // your email app password
        },
    });

    await transporter.sendMail({
        from: `"My Shop" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    });
}


// --- Routes ---
app.post("/create-paypal-order", async (req, res) => {
    try {
        const { amount } = req.body;
        const accessToken = await getAccessToken();

        const response = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                intent: "CAPTURE",
                purchase_units: [
                    {
                        amount: {
                            currency_code: "GBP", // match frontend
                            value: amount,
                        },
                    },
                ],
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(
                `PayPal order failed: ${response.status} ${JSON.stringify(data)}`
            );
        }

        res.json(data);
    } catch (err) {
        console.error("CREATE ORDER ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});


app.post("/capture-paypal-order", async (req, res) => {
    try {
        const { orderID, documentId } = req.body;
        if (!orderID) throw new Error("orderID is required");

        const accessToken = await getAccessToken();
        const pRes = await fetch(
            `${PAYPAL_BASE}/v2/checkout/orders/${orderID}/capture`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const data = await pRes.json();
        if (!pRes.ok) {
            throw new Error(
                `PayPal capture failed: ${pRes.status} ${JSON.stringify(data)}`
            );
        }

        if (data.status === "COMPLETED") {

            const shipping_data = await getShippingData(orderID)

            const { full_name, address, phone, city, postal_code, country, state, delivery_time, shipping_type, email, order_id } = shipping_data.data;

            const productData = await getOrderData(documentId);
            const { total_price, cart_subtotal_price, discount } = productData.data[0];
            const order_items = productData.data[0].order_item;


            // 1. Send email to buyer
            await sendEmail(
                email,
                "Order Placed Successfully",
                `<h2>Thank you ${full_name}!</h2>
                <p>Your order has been placed successfully.</p>
                <p><b>Order ID:</b> ${order_id}</p>
                <p>`
            );

            // 2. Send email to owner
            await sendEmail(
                "sutharharshp04@gmail.com",
                "New Order Received",
                `<h2>New Order from ${full_name}</h2>
                <p><b>Email:</b> ${email}</p>
                <p><b>-------------</b></p>
                <p><b>Shipping Address:</b></p>
                <p><b>Phone: </b>${phone}</p>
                <p><b>Address: </b>${address}</p>
                <p><b>Country: </b>${country}</p>
                <p><b>State: </b>${state}</p>
                <p><b>City: </b>${city}</p>
                <p><b>Postal Code: </b>${postal_code}</p>
                <p><b>Delivery Time: </b>${delivery_time}</p>
                <p><b>Shipping Type: </b>${shipping_type}</p>
                <p><b>Order ID:</b> ${order_id}</p>
                <p><b>-------------</b></p>
                <h3><b>Payment Details:</b></h3>
                <p><b>Cart Total Price: </b>${cart_subtotal_price}</p>
                <p><b>Discount: </b>${discount}</p>
                <p><b>Total: </b>${total_price}</p>
                <p><b>-------------</b></p>
                <h3><b>Product Details:</b></h3>
                ${order_items.map((item) => `
                    <p><b>Product Brand:</b> ${item.product.brand}</p>
                    <p><b>Product:</b> ${item.product.name}</p>
                    <p><b>Quantity:</b> ${item.quantity}</p>
                    <p><b>Model No.:</b> ${item.product.model_no}</p>
                `).join("")}`
            );

            return res.json({
                success: true,
                message: "Payment captured and emails sent!",
            });
        } else {
            return res
                .status(400)
                .json({ success: false, message: "Payment not completed" });
        }
    } catch (err) {
        console.error("CAPTURE ORDER ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(process.env.PORT || 5000, () => {
    console.log("Backend running on http://localhost:5000");
    console.log("Ensure .env has PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, EMAIL_USER, EMAIL_PASS, OWNER_EMAIL");
});
