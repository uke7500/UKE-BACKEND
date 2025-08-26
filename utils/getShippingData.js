const getShippingData = async (shippingDocumentId) => {
    // const shipping_data = await fetch("https://uke-strapi.onrender.com/api/shippings");
    // const shipping_data_json = await shipping_data.json();
    // console.log("All shippings from Strapi:", shipping_data_json);

    // // Try to match order_id with PayPal's orderID
    // const shipping_info = shipping_data_json.data.find(
    //     (info) => info.order_id == orderID
    // );

    // if (!shipping_info) {
    //     throw new Error(`No shipping info found for orderID: ${orderID}`);
    // }

    // console.log("Matched shipping info:", shipping_info);

    // const documentId = shipping_info.documentId;
    // if (!documentId) {
    //     throw new Error(`documentId missing for orderID: ${orderID}`);
    // }

    const temp_buyer_shipping_info = await fetch(
        `https://uke-strapi.onrender.com/api/shippings/${shippingDocumentId}`
    );
    const buyer_shipping_info_json = await temp_buyer_shipping_info.json();

    return buyer_shipping_info_json;
};

export default getShippingData;
