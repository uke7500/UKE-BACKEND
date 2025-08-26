const getOrderData = async (documentId) => {
    const data = await fetch(
        `https://uke-strapi.onrender.com/api/orders?filters[documentId][$eq]=${documentId}&populate[order_item][populate][product][populate]=*`
    );

    const json = await data.json();

    return json;
};

export default getOrderData;
