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

# 설정
DATA_PATH = "emotion_mapping_data.jsonl"  # 학습 데이터
MODEL_NAME = "klue/roberta-base"  # 베이스 모델
OUT_DIR = "./emotion_model"  
SEED = 42
MAX_LEN = 128
EPOCHS = 2
LR = 2e-5
TRAIN_RATIO = 0.9

# 감정 → ID 매핑 (모델 학습용)
label2id = {"분노":0, "슬픔":1, "불안":2, "상처":3, "당황":4, "기쁨":5}
# ID → 감정 매핑 (모델 예측 결과 해석용)
id2label = {v:k for k,v in label2id.items()}

random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

# jsonl 로드
rows = []
with open(DATA_PATH, "r", encoding="utf-8") as f:
    for line in f:
        obj = json.loads(line)  # 한 줄씩 읽어서 딕셔너리로 변환
        text = obj.get("text", "").strip()  # 텍스트 추출 
        emo  = obj.get("emotion", "").strip()  # 감정 추출
        if text and emo in label2id:
            # 텍스트 + 감정을 묶어서 리스트에 저장
            # {"text": "요즘 너무 힘들어", "label": 2}
            rows.append({"text": text, "label": label2id[emo]})

print("로드된 샘플 수:", len(rows))

# 데이터 섞은 후 학습(90%) / 검증(10%) 분리
# 검증 데이터는 학습에 사용하지 않고 매 epoch마다 정확도 확인용으로 사용
random.shuffle(rows)  # 데이터 섞기
split = int(len(rows) * TRAIN_RATIO)  # 90% 지점 계산
train_rows = rows[:split]  # 앞 90% → 학습용
valid_rows = rows[split:]  # 뒤 10% → 검증용

train_ds = Dataset.from_list(train_rows)
valid_ds = Dataset.from_list(valid_rows)

# 텍스트 → 숫자(토큰) 변환 및 전처리
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

def preprocess(batch):
    return tokenizer(batch["text"], truncation=True, max_length=MAX_LEN)

# 학습/검증 데이터 전체에 전처리 적용
train_ds = train_ds.map(preprocess, batched=True)
valid_ds = valid_ds.map(preprocess, batched=True)

collator = DataCollatorWithPadding(tokenizer=tokenizer)

# 감정 분류 모델 로드
model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME,  # 베이스 모델
    num_labels=6,  # 분류할 감정 개수
    id2label=id2label, # ID → 감정 매핑
    label2id=label2id  # 감정 → ID 매핑
)

# 검증 데이터 정확도 계산
def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    return {"accuracy": (preds == labels).mean()}

# 학습 설정 및 실행
args = TrainingArguments(
    output_dir=OUT_DIR,
    num_train_epochs=EPOCHS,
    learning_rate=LR,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=32,
    eval_strategy="epoch",
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

# 학습된 모델 및 토크나이저 저장
trainer.save_model(OUT_DIR)
tokenizer.save_pretrained(OUT_DIR)

print("저장 완료:", OUT_DIR)