import re

with open('src/components/CategoriesManager.tsx', 'r') as f:
    content = f.read()

# Replace inline delete button with a confirmation delete button
# Currently: onClick={() => onDeleteCategory(category.id)}
# Let's see how it looks.

bad_del = "onClick={() => onDeleteCategory(category.id)}"
good_del = """onClick={() => {
                                if (window.confirm('هل أنت متأكد من حذف هذه الفئة وجميع المتاجر والأصناف التابعة لها بشكل نهائي؟')) {
                                  onDeleteCategory(category.id);
                                }
                              }}"""

content = content.replace(bad_del, good_del)

# Remove the inline toggle switch and replace with a static text or simpler view?
# The user wants simpler view. Let's make buttons consistent.

with open('src/components/CategoriesManager.tsx', 'w') as f:
    f.write(content)

