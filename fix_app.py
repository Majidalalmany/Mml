import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Check where orders is passed
if '<OrdersManager' in content:
    print("App.tsx has OrdersManager")
