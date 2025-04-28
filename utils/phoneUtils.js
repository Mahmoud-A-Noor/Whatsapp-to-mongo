function parsePhoneNumber(number) {
  try{
    const _number = "+" + number.split("@")[0]
    return _number;
  }catch(error){
    throw error;
  }
}

module.exports = { parsePhoneNumber };
