function normalizePhone(phone){

    phone = phone.trim();

    // 09012345678 -> +2349012345678
    if(phone.startsWith("0")){

        return "+234" + phone.substring(1);

    }


    // 2349012345678 -> +2349012345678
    if(phone.startsWith("234")){

        return "+" + phone;

    }


    return phone;

}


module.exports = normalizePhone;
