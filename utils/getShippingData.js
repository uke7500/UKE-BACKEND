const getShippingData = async (shippingDocumentId) => {

    const STRAPI_URL = process.env.STRAPI_URL;

    const temp_buyer_shipping_info = await fetch(
        STRAPI_URL + `/api/shippings/${shippingDocumentId}`
    );
    const buyer_shipping_info_json = await temp_buyer_shipping_info.json();

    return buyer_shipping_info_json;
};

export default getShippingData;
