import json

# 입력 파일 (원본 데이터)
INPUT_PATH = "dialogue_data.json"

# 출력 파일 (변환 데이터)
OUTPUT_PATH = "emotion_mapping_data.jsonl"

# 감정 코드 → 감정 그룹 매핑 (E10~E69, 총 60개)
# {"E10": "분노", "E11": "분노", ..., "E69": "기쁨"}
emotion_group_map = {}

# 분노: E10~E19
for i in range(10, 20):
    emotion_group_map[f"E{i}"] = "분노"

# 슬픔: E20~E29
for i in range(20, 30):
    emotion_group_map[f"E{i}"] = "슬픔"

# 불안: E30~E39
for i in range(30, 40):
    emotion_group_map[f"E{i}"] = "불안"

# 상처: E40~E49
for i in range(40, 50):
    emotion_group_map[f"E{i}"] = "상처"

# 당황: E50~E59
for i in range(50, 60):
    emotion_group_map[f"E{i}"] = "당황"

# 기쁨: E60~E69
for i in range(60, 70):
    emotion_group_map[f"E{i}"] = "기쁨"


# JSON 로드
with open(INPUT_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

if isinstance(data, dict):
    data = [data]

count = 0
skipped = 0
unknown_codes = {}

with open(OUTPUT_PATH, "w", encoding="utf-8") as out:
    for item in data:
        try:
            # 원본 데이터에서 감정 코드 추출
            emotion_code = item["profile"]["emotion"]["type"]  # ex) "E32"
        except Exception:
            skipped += 1
            continue
        
        # 딕셔너리에서 코드에 해당하는 감정 이름으로 변환
        emotion_group = emotion_group_map.get(emotion_code)  # ex) "불안"
        if emotion_group is None:
            # 혹시 E10~E69 밖의 코드가 있으면 기록만 해두고 스킵
            unknown_codes[emotion_code] = unknown_codes.get(emotion_code, 0) + 1
            continue

        # 대화 내용 추출 (HS01, HS02, HS03)
        contents = item.get("talk", {}).get("content", {})

        for key in ["HS01", "HS02", "HS03"]:
            text = contents.get(key, "").strip()
            if not text:
                continue

            # 텍스트 + 감정을 묶어서 각각 한 줄로 저장
            row = {"text": text, "emotion": emotion_group}
            out.write(json.dumps(row, ensure_ascii=False) + "\n")
            count += 1

print("완료")
print("생성된 문장 수:", count)
print("파싱 실패/스킵된 아이템 수:", skipped)
print("파일:", OUTPUT_PATH)

if unknown_codes:
    print("\n[경고] 매핑되지 않은 emotion code 발견:")
    for k, v in sorted(unknown_codes.items()):
        print(f"  {k}: {v}")