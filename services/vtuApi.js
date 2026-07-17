const vtuRequest = async (method, endpoint, data = null) => {

  return {
    success: false,
    message: "VTU provider not connected yet"
  };

};


module.exports = {
  vtuRequest
};
