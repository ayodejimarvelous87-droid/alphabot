from pathlib import Path
import re

file = Path("services/oplugService.js")

text = file.read_text()

pattern = r"""return\s*\{\s*
\s*\.\.\.plan,\s*
\s*id:\s*plan\.id,\s*
\s*plan_id:\s*plan\.plan_id\s*
\s*\};"""

replacement = """return {
  ...plan,
  id: match?.id || plan.id,
  providerPlanId: match?.id || plan.plan_id,
  plan_id: match?.id || plan.plan_id
};"""

new_text, count = re.subn(pattern, replacement, text)

if count == 0:
    print("❌ Block still not found")
else:
    file.write_text(new_text)
    print("✅ OPLUG plan mapping fixed")
