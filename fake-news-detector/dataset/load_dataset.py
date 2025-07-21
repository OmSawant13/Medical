import os
import requests
import zipfile
import pandas as pd

# Step 1: Download the LIAR dataset zip if not already present
url = "https://www.cs.ucsb.edu/~william/data/liar_dataset.zip"
zip_path = "liar_dataset.zip"
extract_dir = "liar_dataset"

if not os.path.exists(zip_path):
    print("Downloading LIAR dataset...")
    r = requests.get(url)
    with open(zip_path, "wb") as f:
        f.write(r.content)

# Step 2: Extract the zip file
if not os.path.exists(extract_dir):
    print("Extracting LIAR dataset...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_dir)

# Step 3: Load CSVs with pandas
train_csv = os.path.join(extract_dir, "train.tsv")
valid_csv = os.path.join(extract_dir, "valid.tsv")
test_csv = os.path.join(extract_dir, "test.tsv")

train_df = pd.read_csv(train_csv, sep='\t')
valid_df = pd.read_csv(valid_csv, sep='\t')
test_df = pd.read_csv(test_csv, sep='\t')

# Step 4: Save as CSV (optional, for compatibility)
train_df.to_csv("liar_train.csv", index=False)
valid_df.to_csv("liar_valid.csv", index=False)
test_df.to_csv("liar_test.csv", index=False)

# Step 5: Show a sample
print(train_df.head(1))
