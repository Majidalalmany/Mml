import re

with open('src/components/DriversMapManager.tsx', 'r') as f:
    content = f.read()

# Replace the default statusFilter
old_default = "const [statusFilter, setStatusFilter] = useState<'available' | 'online' | 'busy' | 'offline' | 'all'>('available');"
new_default = "const [statusFilter, setStatusFilter] = useState<'available' | 'online' | 'busy' | 'offline' | 'all'>('all');"

if old_default in content:
    content = content.replace(old_default, new_default)
    with open('src/components/DriversMapManager.tsx', 'w') as f:
        f.write(content)
    print("Fixed default status filter")
else:
    print("Could not find old_default")

