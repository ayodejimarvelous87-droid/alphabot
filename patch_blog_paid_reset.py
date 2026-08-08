from pathlib import Path

path = Path("controllers/blogPayoutController.js")

text = path.read_text()

old = """payout.status="paid";
payout.paidAt=new Date();

await payout.save();"""

new = """payout.status="paid";
payout.paidAt=new Date();

const BlogPartner = require("../models/BlogPartner");

const partner = await BlogPartner.findById(payout.blogPartner);

if(partner){
  partner.lastPayoutDate = new Date();
  partner.payoutReminderSent = false;
  await partner.save();
}

await payout.save();"""

if old in text:
    text = text.replace(old,new)
    path.write_text(text)
    print("✅ Blog payout reset added")
else:
    print("❌ Paid block not found")
