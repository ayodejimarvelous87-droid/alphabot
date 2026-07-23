const getErrorMessage = (error) => {

if(!error){
return "Something went wrong";
}

return (
error.response?.data?.message ||
error.response?.data?.error ||
error.response?.data?.msg ||
error.message ||
"Something went wrong"
);

};

module.exports = getErrorMessage;
