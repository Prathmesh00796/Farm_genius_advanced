
import re
import json

with open('train_disease_model.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the NORMALIZE dictionary content
match = re.search(r'NORMALIZE = \{(.*?)\}', content, re.DOTALL)
if match:
    dict_content = match.group(1)
    # Find all values in the dictionary
    values = re.findall(r':\s+"([^"]+)"', dict_content)
    unique_classes = sorted(list(set(values)))
    print(f"Total unique classes: {len(unique_classes)}")
    
    # Save to class_labels.json
    with open('models/class_labels.json', 'w', encoding='utf-8') as f:
        json.dump(unique_classes, f, indent=2)
    print(f"Saved {len(unique_classes)} classes to models/class_labels.json")
else:
    print("NORMALIZE dictionary not found")
