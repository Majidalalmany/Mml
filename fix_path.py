import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("import('../lib/firebase')", "import('./lib/firebase')")

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Fixed path")
