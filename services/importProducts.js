const axios = require("axios");
const Product = require("../models/Product");
const vtuConfig = require("../config/vtu");

async function importProducts() {

  try {

    const response = await axios.get(
      `${vtuConfig.apiUrl}/APIDatabundlePlansV2.asp`,
      {
        params: {
          UserID: vtuConfig.userId
        }
      }
    );

    const networks = response.data.MOBILE_NETWORK;

    for (const networkName in networks) {

      const network = networks[networkName][0];

      for (const plan of network.PRODUCT) {

        await Product.updateOne(
          {
            network: network.ID,
            providerCode: plan.PRODUCT_ID
          },
          {
            network: network.ID,
            name: plan.PRODUCT_NAME,
            type: "data",
            price: Number(plan.PRODUCT_AMOUNT),
            validity: "",
            providerCode: plan.PRODUCT_ID,
            status: "active"
          },
          {
            upsert: true
          }
        );

      }

    }

    console.log("Products imported successfully.");

  } catch (err) {

    console.log(err.response?.data || err.message);

  }

}

importProducts();
