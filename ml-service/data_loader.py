from typing import Tuple, List, Dict
from pymongo import MongoClient

# Schema mong đợi:
# lessons: {_id, title, summary, topic, tags[], level, markdown?, blocks?, prereqs?, quiz_pool?, slug?}
# events:  {userId, lessonId?, lessonSlug?, type, score, createdAt}
# learning_states: {userId, goals[], answers?, levelHint?, known_topics?}

def load_lessons_events(mongo_uri: str, db_name: str) -> Tuple[List[Dict], List[Dict]]:
    cli = MongoClient(mongo_uri)
    db = cli[db_name]

    # Thử 'lessons' trước, fallback 'lesson'
    proj = {
        "_id": 1, "title": 1, "summary": 1, "topic": 1, "tags": 1, "level": 1,
        "markdown": 1, "blocks": 1, "prereqs": 1, "quiz_pool": 1, "slug": 1
    }

    lessons = list(db.lessons.find({}, proj))
    if not lessons:
        lessons = list(db.lesson.find({}, proj))

    events = list(db.events.find(
        {}, {"userId": 1, "lessonId": 1, "lessonSlug": 1, "type": 1, "score": 1, "createdAt": 1}
    ).sort("createdAt", -1))

    return lessons, events


def load_user_recent(mongo_uri: str, db_name: str, user_id: str, limit: int = 20) -> List[str]:
    """
    Trả về danh sách id/slug của lesson mà user tương tác gần đây (ưu tiên ObjectId).
    """
    cli = MongoClient(mongo_uri)
    db = cli[db_name]
    ev = list(db.events.find(
        {"userId": user_id},
        {"lessonId": 1, "lessonSlug": 1, "createdAt": 1}
    ).sort("createdAt", -1).limit(limit))

    out: List[str] = []
    for r in ev:
        if r.get("lessonId"):
            out.append(str(r["lessonId"]))    # ưu tiên ObjectId vì meta dùng _id
        elif r.get("lessonSlug"):
            out.append(str(r["lessonSlug"]))  # fallback slug
    return out
