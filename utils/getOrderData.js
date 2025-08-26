const getOrderData = async (documentId) => {

    const STRAPI_URL = process.env.STRAPI_URL;

    const data = await fetch(
        STRAPI_URL + `/api/orders?filters[documentId][$eq]=${documentId}&populate[order_item][populate][product][populate]=*`
    );

    const json = await data.json();

    return json;
};

export default getOrderData;
