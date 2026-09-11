import re

with open('src/components/OrdersManager.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { db, collection, addDoc, onSnapshot, query, doc, updateDoc, setDoc, serverTimestamp } from '../lib/firebase';", "import { db, collection, addDoc, onSnapshot, query, doc, updateDoc, setDoc, serverTimestamp, deleteDoc } from '../lib/firebase';")

with open('src/components/OrdersManager.tsx', 'w') as f:
    f.write(content)

