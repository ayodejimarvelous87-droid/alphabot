from pathlib import Path

p = Path("services/oplugService.js")

s = p.read_text()

old = """type: plan.type,
datasize: plan.size || plan.datasize,
day: plan.validity,
name: plan.name,"""

new = """type: plan.id.includes("gifting") ? "GIFTING" :
      plan.id.includes("sme") ? "SME" :
      plan.id.includes("awoof") ? "AWOOF" :
      "DATA",

datasize: plan.size !== "N/A" ? plan.size : "DATA",

day: plan.validity || "30 Days",

name: `${plan.network} DATA PLAN`,"""

if old not in s:
    print("❌ Target block not found")
    exit()

s = s.replace(old, new)

p.write_text(s)

print("✅ OPLUG plan details improved")
