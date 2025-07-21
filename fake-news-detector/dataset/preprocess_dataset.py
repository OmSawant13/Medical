import pandas as pd
import re

def clean_text(text):
    if not isinstance(text, str):
        text = str(text)
    text = text.lower()
    text = re.sub(r"[^\w\s]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

# Load LIAR dataset
print("Loading LIAR dataset...")
liar_train = pd.read_csv("clean_train.csv")
liar_valid = pd.read_csv("clean_valid.csv")
liar_test = pd.read_csv("clean_test.csv")

# Load FakeNewsNet dataset
print("Loading FakeNewsNet dataset...")
fakenews_fake = pd.read_csv("FakeNewsNet/dataset/politifact_fake.csv")
fakenews_real = pd.read_csv("FakeNewsNet/dataset/politifact_real.csv")

# Add labels
fakenews_fake['label'] = 'false'
fakenews_real['label'] = 'true'

# Combine fake and real news
fakenews = pd.concat([fakenews_fake, fakenews_real], ignore_index=True)

# Clean text (use title as statement since text is not available in CSV)
print("Cleaning FakeNewsNet text...")
fakenews['statement'] = fakenews['title'].apply(clean_text)
fakenews = fakenews[['statement', 'label']]

# Combine all datasets
print("Combining datasets...")
combined_train = pd.concat([liar_train, fakenews], ignore_index=True)

# Save combined dataset
print("Saving combined dataset...")
combined_train.to_csv("dataset/combined_train.csv", index=False)
liar_valid.to_csv("dataset/combined_valid.csv", index=False)
liar_test.to_csv("dataset/combined_test.csv", index=False)

print("✅ Datasets combined and saved!")
print(f"Total training examples: {len(combined_train)}")
print("\nLabel distribution in combined training set:")
print(combined_train['label'].value_counts())