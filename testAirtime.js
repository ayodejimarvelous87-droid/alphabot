const { buyAirtime } = require("./services/clubkonnectAirtime");

async function test(){

const result = await buyAirtime(
  "+2349064659593",
  "MTN",
  10
);

console.log(result);

}

test();
