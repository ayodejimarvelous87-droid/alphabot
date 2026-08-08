from pathlib import Path

path = Path("controllers/blogPayoutController.js")

text = path.read_text()

old = """const BlogPartner = require("../models/BlogPartner");

const partner = await BlogPartner.findById(payout.blogPartner);

"""

if old in text:
    text = text.replace(old, "")
    path.write_text(text)
    print("✅ Duplicate partner block removed")
else:
    print("❌ Duplicate block not found")
