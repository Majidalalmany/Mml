import re

with open('src/components/OrdersManager.tsx', 'r') as f:
    content = f.read()

pattern = re.compile(
    r"  useEffect\(\(\) => \{\n    try \{\n(.*?)"
    r"      const ordersQuery = query\(collection\(db, 'orders'\)\);\n"
    r"      const unsubscribe = onSnapshot\(ordersQuery, \(snapshot\) => \{(.*?)"
    r"      \}, \(err\) => \{\n        console\.warn\('Orders onSnapshot error in OrdersManager:', err\);\n      \}\);\n"
    r"(.*?)"
    r"      return \(\) => \{\n        unsubscribe\(\);\n        window\.removeEventListener\('jahez_order_placed', handleOrderPlaced\);\n      \};\n"
    r"    \} catch \(err\) \{\n        console\.warn\('Orders listener fallback:', err\);\n    \}\n"
    r"  \}, \[\]\);", re.DOTALL)

# Try another search approach if that exact match fails due to some character differences.
def replace_effect(text):
    # Find start
    start_str = "  // Realtime Orders Listener from Firestore 'orders' collection\n  const [liveOrders, setLiveOrders] = useState<Order[]>(orders);\n\n  useEffect(() => {\n    try {"
    if start_str not in text:
        return text
    start_idx = text.find(start_str)
    end_str = "    } catch (err) {\n      console.warn('Orders listener fallback:', err);\n    }\n  }, []);"
    end_idx = text.find(end_str, start_idx) + len(end_str)
    
    if end_idx < len(end_str):
        # Maybe the catch block is different
        end_str2 = "    } catch (e) {\n      console.warn('Orders listener setup error in OrdersManager:', e);\n    }\n  }, []);"
        end_idx = text.find(end_str2, start_idx)
        if end_idx > -1:
            end_idx += len(end_str2)
        else:
            return text
            
    old_effect = text[start_idx:end_idx]
    
    new_effect = old_effect.replace("    try {\n", "    let unsubscribe: any;\n    try {\n")
    new_effect = new_effect.replace("      const unsubscribe = onSnapshot(ordersQuery", "      unsubscribe = onSnapshot(ordersQuery")
    new_effect = new_effect.replace("      return () => {\n        unsubscribe();", "      return () => {\n        if (unsubscribe) unsubscribe();")
    
    # Also we need to make sure the return () => is outside the try block
    # Actually, if we just extract the return and put it outside, that's better.
    new_effect = new_effect.replace("      return () => {\n        if (unsubscribe) unsubscribe();\n        window.removeEventListener('jahez_order_placed', handleOrderPlaced);\n      };\n", "")
    new_effect = new_effect.replace("    } catch (e) {\n      console.warn('Orders listener setup error in OrdersManager:', e);\n    }", "    } catch (e) {\n      console.warn('Orders listener setup error in OrdersManager:', e);\n    }\n    return () => {\n      if (unsubscribe) unsubscribe();\n      window.removeEventListener('jahez_order_placed', handleOrderPlaced);\n    };")

    return text.replace(old_effect, new_effect)

content = replace_effect(content)
with open('src/components/OrdersManager.tsx', 'w') as f:
    f.write(content)

