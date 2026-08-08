from pathlib import Path

p = Path("services/oplugService.js")
lines = p.read_text().splitlines()

# remove the leftover block after the new getDataPlans
out = []
skip = False

for i,line in enumerate(lines, start=1):
    if i == 132:
        skip = True
    if not skip:
        out.append(line)

p.write_text("\n".join(out)+"\n")
print("✅ cleaned leftover lines")
