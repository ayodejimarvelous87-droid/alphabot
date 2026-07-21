function normalizePhone(phone){

    if(!phone) return phone;

    phone = phone.trim().replace(/\s+/g,"");


    // 09012345678 -> +2349012345678
    if(phone.startsWith("0")){

        return "+234" + phone.substring(1);

    }


    // 2349012345678 -> +2349012345678
    if(phone.startsWith("234")){

        return "+" + phone;

    }


    // +2349012345678 already correct
    if(phone.startsWith("+234")){

        return phone;

    }


    // 9012345678 -> +2349012345678
    if(phone.length === 10){

        return "+234" + phone;

    }


    return phone;

}


module.exports = normalizePhone;
