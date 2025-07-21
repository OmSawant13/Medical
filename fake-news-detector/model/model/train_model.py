# model/train_model.py

import pandas as pd
import numpy as np
from sklearn.metrics import classification_report
import torch
from torch.optim import AdamW
from transformers import (
    BertTokenizer, 
    BertForSequenceClassification,
    get_linear_schedule_with_warmup
)
from torch.utils.data import Dataset, DataLoader
import torch.nn.functional as F
from sklearn.model_selection import train_test_split
import logging
import random
from torch.cuda.amp import autocast, GradScaler

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Set random seeds for reproducibility
def set_seed(seed=42):
    random.seed(seed)``
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)

set_seed()

# Custom dataset class for BERT
class FakeNewsDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_len=256):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_len = max_len
    
    def __len__(self):
        return len(self.texts)
    
    def __getitem__(self, idx):
        text = str(self.texts[idx])
        label = self.labels[idx]

        # Tokenize and prepare input
        encoding = self.tokenizer.encode_plus(
            text,
            add_special_tokens=True,
            max_length=self.max_len,
            return_token_type_ids=False,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            return_tensors='pt'
        )

        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'labels': torch.tensor(label, dtype=torch.long)
        }

def train_epoch(model, data_loader, optimizer, scheduler, device, scaler):
    model.train()
    total_loss = 0
    total_steps = len(data_loader)
    
    for step, batch in enumerate(data_loader):
        input_ids = batch['input_ids'].to(device)
        attention_mask = batch['attention_mask'].to(device)
        labels = batch['labels'].to(device)

        optimizer.zero_grad()

        # Use mixed precision training
        with autocast():
            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels
            )
            loss = outputs.loss

        total_loss += loss.item()

        # Scale loss and call backward
        scaler.scale(loss).backward()
        scaler.unscale_(optimizer)
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        
        # Update weights
        scaler.step(optimizer)
        scaler.update()
        scheduler.step()

        if step % 100 == 0:  # Reduced logging frequency
            logger.info(f'Batch {step}/{total_steps} - Loss: {loss.item():.4f}')

    return total_loss / total_steps

def evaluate(model, data_loader, device):
    model.eval()
    val_preds = []
    val_labels = []
    total_loss = 0
    
    with torch.no_grad():
        for batch in data_loader:
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels = batch['labels'].to(device)
            
            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels
            )
            
            loss = outputs.loss
            total_loss += loss.item()
            
            preds = torch.argmax(outputs.logits, dim=1)
            val_preds.extend(preds.cpu().numpy())
            val_labels.extend(labels.cpu().numpy())
    
    return val_preds, val_labels, total_loss / len(data_loader)

def main():
    # Load data
    logger.info("Loading datasets...")
    train_df = pd.read_csv("../../dataset/combined_train.csv")
    valid_df = pd.read_csv("../../dataset/combined_valid.csv")

    # Print original dataset statistics
    logger.info("\n=== Original Dataset Statistics ===")
    logger.info(f"Original total samples: {len(train_df) + len(valid_df)}")
    logger.info(f"Original training samples: {len(train_df)}")
    logger.info(f"Original validation samples: {len(valid_df)}")

    # Convert labels to numeric first
    label_map = {
        'true': 0, 'mostly-true': 0,  # Combine similar classes
        'false': 1, 'pants-fire': 1,
        'half-true': 2, 'barely-true': 2
    }
    train_df['label'] = train_df['label'].replace(label_map)
    valid_df['label'] = valid_df['label'].replace(label_map)

    # Create smaller balanced dataset
    samples_per_class = 500  # We'll take 500 samples per class
    
    # Balance training data
    balanced_train = []
    for label in [0, 1, 2]:  # For each class (true, false, uncertain)
        class_samples = train_df[train_df['label'] == label].sample(n=samples_per_class, random_state=42)
        balanced_train.append(class_samples)
    
    train_df = pd.concat(balanced_train, ignore_index=True)
    
    # Balance validation data
    val_samples_per_class = 100  # Smaller validation set
    balanced_valid = []
    for label in [0, 1, 2]:
        class_samples = valid_df[valid_df['label'] == label].sample(n=val_samples_per_class, random_state=42)
        balanced_valid.append(class_samples)
    
    valid_df = pd.concat(balanced_valid, ignore_index=True)

    # Print new dataset statistics
    logger.info("\n=== Reduced Dataset Statistics ===")
    logger.info(f"New total samples: {len(train_df) + len(valid_df)}")
    logger.info(f"New training samples: {len(train_df)}")
    logger.info(f"New validation samples: {len(valid_df)}")
    
    logger.info("\nClass distribution in reduced training set:")
    logger.info(train_df['label'].map({0: 'true', 1: 'false', 2: 'uncertain'}).value_counts().to_string())
    
    # Adjust batch size and epochs for smaller dataset
    BATCH_SIZE = 16  # Reduced batch size for M2 Mac
    EPOCHS = 10     # Increased epochs since we have less data
    MAX_LEN = 256
    LEARNING_RATE = 2e-5
    WARMUP_STEPS = 0
    WEIGHT_DECAY = 0.01

    # Initialize BERT model and tokenizer
    logger.info("\nInitializing BERT model...")
    model_name = 'bert-base-uncased'
    tokenizer = BertTokenizer.from_pretrained(model_name)
    model = BertForSequenceClassification.from_pretrained(
        model_name,
        num_labels=3,
        output_attentions=False,
        output_hidden_states=False
    )

    # Create data loaders
    train_dataset = FakeNewsDataset(
        texts=train_df['statement'].values,
        labels=train_df['label'].values,
        tokenizer=tokenizer,
        max_len=MAX_LEN
    )

    valid_dataset = FakeNewsDataset(
        texts=valid_df['statement'].values,
        labels=valid_df['label'].values,
        tokenizer=tokenizer,
        max_len=MAX_LEN
    )

    train_loader = DataLoader(
        train_dataset,
        batch_size=BATCH_SIZE,
        shuffle=True,
        num_workers=2,  # Reduced workers for M2 Mac
        pin_memory=True
    )

    valid_loader = DataLoader(
        valid_dataset,
        batch_size=BATCH_SIZE,
        shuffle=False,
        num_workers=2,
        pin_memory=True
    )

    # Training settings
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    logger.info(f"Using device: {device}")
    
    model = model.to(device)

    # Initialize optimizer and scheduler
    optimizer = AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
    total_steps = len(train_loader) * EPOCHS
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=WARMUP_STEPS,
        num_training_steps=total_steps
    )

    # Initialize gradient scaler for mixed precision training
    scaler = GradScaler()

    # Training loop
    logger.info("Starting training...")
    best_f1 = 0
    best_model_state = None

    for epoch in range(EPOCHS):
        logger.info(f"\nEpoch {epoch + 1}/{EPOCHS}")
        
        # Training
        avg_train_loss = train_epoch(model, train_loader, optimizer, scheduler, device, scaler)
        logger.info(f"Average training loss: {avg_train_loss:.4f}")
        
        # Validation
        val_preds, val_labels, avg_val_loss = evaluate(model, valid_loader, device)
        
        # Print metrics
        report = classification_report(val_labels, val_preds, 
                                    target_names=['true', 'false', 'uncertain'],
                                    digits=4)
        logger.info("\nValidation Results:")
        logger.info(f"Average validation loss: {avg_val_loss:.4f}")
        logger.info("\nClassification Report:")
        logger.info(report)
        
        # Calculate macro F1 score
        from sklearn.metrics import f1_score
        current_f1 = f1_score(val_labels, val_preds, average='macro')
        
        # Save best model
        if current_f1 > best_f1:
            best_f1 = current_f1
            best_model_state = model.state_dict().copy()
            logger.info(f"New best model saved! F1: {best_f1:.4f}")

    # Save the best model
    logger.info("\nSaving best model...")
    torch.save(best_model_state, "../bert_fake_news_model.pt")
    logger.info("✅ Training completed!")

if __name__ == "__main__":
    main()
