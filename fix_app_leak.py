import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace the nested onSnapshot with getDocs
bad_block = """        // Fallback check on app_users
        const legacyQuery = query(collection(db, 'app_users'));
        onSnapshot(legacyQuery, (legSnap) => {
          const legList: AppUser[] = legSnap.docs.map(d => ({ id: d.id, ...d.data() })) as AppUser[];
          if (legList.length > 0) {
            setAppUsers(legList);
          } else {
            fetch('/api/users')
              .then(res => res.json())
              .then(data => { if (data.users) setAppUsers(data.users); })
              .catch(() => {});
          }
          setIsLoadingAppUsers(false);
        }, () => {
          fetch('/api/users')
            .then(res => res.json())
            .then(data => { if (data.users) setAppUsers(data.users); })
            .catch(() => {})
            .finally(() => setIsLoadingAppUsers(false));
        });"""

good_block = """        // Fallback check on app_users
        const legacyQuery = query(collection(db, 'app_users'));
        import('../lib/firebase').then(({ getDocs }) => {
          getDocs(legacyQuery).then((legSnap) => {
            const legList = legSnap.docs.map(d => ({ id: d.id, ...d.data() })) as AppUser[];
            if (legList.length > 0) {
              setAppUsers(legList);
            } else {
              fetch('/api/users')
                .then(res => res.json())
                .then(data => { if (data.users) setAppUsers(data.users); })
                .catch(() => {});
            }
            setIsLoadingAppUsers(false);
          }).catch(() => {
            fetch('/api/users')
              .then(res => res.json())
              .then(data => { if (data.users) setAppUsers(data.users); })
              .catch(() => {})
              .finally(() => setIsLoadingAppUsers(false));
          });
        });"""

if bad_block in content:
    content = content.replace(bad_block, good_block)
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Fixed App.tsx leak")
else:
    print("Could not find the block in App.tsx")

