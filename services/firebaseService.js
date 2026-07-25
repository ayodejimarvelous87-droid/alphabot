require("dotenv").config();

const admin = require("firebase-admin");
const { getMessaging } = require("firebase-admin/messaging");


const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url:
    process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url:
    process.env.FIREBASE_CLIENT_CERT_URL
};


admin.initializeApp({
  credential: admin.cert(serviceAccount)
});


const sendPushNotification = async(
  token,
  title,
  body
)=>{

  try{

    await getMessaging().send({
      token,

      notification:{
        title,
        body
      }

    });

    console.log("Push notification sent");

  }catch(error){

    console.log(
      "Firebase notification error:",
      error.message
    );

  }

};


module.exports = {
  sendPushNotification
};
