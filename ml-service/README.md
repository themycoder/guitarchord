# ML Service – TF-IDF Recommender (v2, friendly for beginners)

## Run
pip install -r requirements.txt
uvicorn app:app --reload --port 8000

## Train
POST /train
{ "mongo_uri": "mongodb://localhost:27017", "db_name": "chorddb", "use_lsa": true }

## Onboarding (ask once)
GET  /questions
POST /save-answers { "userId": "U1", "answers": { ... } }
  -> lưu goals + levelHint

## Recommend
POST /recommend {"userId":"U1","k":8}
  - nếu client không gửi maxLevel, API tự lấy levelHint đã lưu
  - personalize theo events gần đây

## Mongo collections
- lessons / lesson
- events(userId, lessonId? or lessonSlug?, createdAt, ...)
- learning_states(userId, goals[], answers?, levelHint?)
