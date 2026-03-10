!pip install -U transformers datasets accelerate

import json, random
import numpy as np
import torch
from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    Trainer,
    TrainingArguments,
    DataCollatorWithPadding,
)

# =========================
# 설정
# =========================
DATA_PATH = "emotion_mapping_data.jsonl"
MODEL_NAME = "klue/roberta-base"
OUT_DIR = "./emotion_model"
SEED = 42
MAX_LEN = 128
EPOCHS = 2
LR = 2e-5
TRAIN_RATIO = 0.9

label2id = {"분노":0, "슬픔":1, "불안":2, "상처":3, "당황":4, "기쁨":5}
id2label = {v:k for k,v in label2id.items()}

random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

# =========================
# jsonl 로드
# =========================
rows = []
with open(DATA_PATH, "r", encoding="utf-8") as f:
    for line in f:
        obj = json.loads(line)
        text = obj.get("text", "").strip()
        emo  = obj.get("emotion", "").strip()
        if text and emo in label2id:
            rows.append({"text": text, "label": label2id[emo]})

print("로드된 샘플 수:", len(rows))

# =========================
# train/valid split
# =========================
random.shuffle(rows)
split = int(len(rows) * TRAIN_RATIO)
train_rows = rows[:split]
valid_rows = rows[split:]

train_ds = Dataset.from_list(train_rows)
valid_ds = Dataset.from_list(valid_rows)

# =========================
# tokenizer & preprocess
# =========================
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

def preprocess(batch):
    return tokenizer(batch["text"], truncation=True, max_length=MAX_LEN)

train_ds = train_ds.map(preprocess, batched=True)
valid_ds = valid_ds.map(preprocess, batched=True)

collator = DataCollatorWithPadding(tokenizer=tokenizer)

# =========================
# model
# =========================
model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME,
    num_labels=6,
    id2label=id2label,
    label2id=label2id
)

# =========================
# metrics
# =========================
def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    return {"accuracy": (preds == labels).mean()}

# =========================
# training args
# =========================
args = TrainingArguments(
    output_dir=OUT_DIR,
    num_train_epochs=EPOCHS,
    learning_rate=LR,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=32,
    eval_strategy="epoch",          # ✅ 여기만 변경
    save_strategy="epoch",
    logging_steps=200,
    fp16=torch.cuda.is_available(),
    seed=SEED,
)

trainer = Trainer(
    model=model,
    args=args,
    train_dataset=train_ds,
    eval_dataset=valid_ds,
    data_collator=collator,
    compute_metrics=compute_metrics
)

trainer.train()

# =========================
# save
# =========================
trainer.save_model(OUT_DIR)
tokenizer.save_pretrained(OUT_DIR)

print("저장 완료:", OUT_DIR)