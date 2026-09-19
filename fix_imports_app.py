with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { db, collection, addDoc, onSnapshot, query, doc, updateDoc, setDoc, getDocs, deleteDoc } from './lib/firebase';", "import { db, collection, addDoc, onSnapshot, query, doc, updateDoc, setDoc, getDocs, deleteDoc, writeBatch } from './lib/firebase';")
# also check if it's imported differently
if "writeBatch } from './lib/firebase'" not in content:
    content = content.replace("deleteDoc } from './lib/firebase';", "deleteDoc, writeBatch } from './lib/firebase';")

with open('src/App.tsx', 'w') as f:
    f.write(content)
