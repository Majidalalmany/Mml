import re

with open('src/components/OrdersManager.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "}, { merge: true });" in line:
        # check if this is part of an await setDoc(doc...
        # Look backwards to find the start of the object
        is_set_doc = False
        j = i
        while j >= max(0, i - 15):
            if "await setDoc(doc(" in lines[j] or "setDoc(doc(" in lines[j]:
                is_set_doc = True
                break
            j -= 1
        
        if not is_set_doc:
            lines[i] = line.replace("}, { merge: true });", "});")

with open('src/components/OrdersManager.tsx', 'w') as f:
    f.writelines(lines)

