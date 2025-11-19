# Bộ câu hỏi mở rộng – thân thiện cho người mới,
# cho phép đánh dấu "đã biết" để loại khỏi gợi ý (đưa sang Ôn tập).

DEFAULT_QUESTIONS = [
  {
    "key": "aim",
    "title": "Bạn muốn đạt mục tiêu nào trước?",
    "options": [
      {"key": "strum_sing", "label": "Đệm hát & quạt nhịp"},
      {"key": "fingerstyle", "label": "Fingerstyle cơ bản"},
      {"key": "theory", "label": "Hiểu hợp âm & tone"},
      {"key": "solo", "label": "Solo & kỹ thuật (bend/slide)"}
    ]
  },
  {
    "key": "exp",
    "title": "Kinh nghiệm hiện tại của bạn với guitar?",
    "options": [
      {"key": "brand_new", "label": "Mới toanh (chưa biết gì)"},
      {"key": "touched", "label": "Đã chạm vào đàn, biết chút ít"},
      {"key": "some_basics", "label": "Đã học một số cơ bản (hợp âm mở, đếm nhịp...)"}
    ]
  },
  {
    "key": "basic",
    "title": "Bạn đã học/biết những gì? (chọn được nhiều)",
    "multi": True,
    "options": [
      {"key": "open_chords",     "label": "Hợp âm mở (C, G, Am, Em...)"},
      {"key": "strumming_basic", "label": "Đệm hát cơ bản / quạt nhịp"},
      {"key": "tuning",          "label": "Tự chỉnh dây (tuning)"},
      {"key": "metronome",       "label": "Tập với metronome / đếm nhịp"},
      {"key": "barre_try",       "label": "Đã thử hợp âm chặn (barre)"},
      {"key": "reading_charts",  "label": "Đọc chart/hợp âm bài hát"}
    ]
  },
  {
    "key": "style",
    "title": "Bạn thích phong cách nào?",
    "options": [
      {"key": "pop", "label": "Pop/Ballad"},
      {"key": "rock", "label": "Rock/Power"},
      {"key": "blues", "label": "Blues"}
    ]
  },
  {
    "key": "time",
    "title": "Mỗi ngày bạn có thể dành bao lâu?",
    "options": [
      {"key": "t15", "label": "~15 phút"},
      {"key": "t30", "label": "~30 phút"},
      {"key": "t60", "label": "~60 phút"}
    ]
  },
  {
    "key": "gear",
    "title": "Bạn đang có nhạc cụ gì?",
    "options": [
      {"key": "acoustic", "label": "Guitar Acoustic"},
      {"key": "electric", "label": "Guitar Electric"},
      {"key": "none", "label": "Chưa có đàn (xem video/chuẩn bị mua)"}
    ]
  }
]

# Map câu trả lời -> goals (tags/topics)
ANSWER_GOALS_MAP = {
  "aim": {
    "strum_sing": ["rhythm", "strumming", "dem-hat"],
    "fingerstyle": ["fingerstyle", "arpeggio", "pima"],
    "theory": ["theory", "chord", "tone", "roman"],
    "solo": ["solo", "bend", "slide", "hammer", "pulloff"]
  },
  "style": {
    "pop": ["pop", "ballad"],
    "rock": ["rock", "power"],
    "blues": ["blues", "pentatonic"]
  },
  "exp": {
    "brand_new":   ["level1"],
    "touched":     ["level1"],
    "some_basics": ["level2"]
  },
  "basic": {
    "open_chords":     ["open-chords", "chord"],
    "strumming_basic": ["strumming", "rhythm"],
    "tuning":          ["tuning", "ear", "setup"],
    "metronome":       ["metronome", "timing", "subdivision"],
    "barre_try":       ["barre", "strength"],
    "reading_charts":  ["chart-reading", "songbook"]
  },
  "time": {
    "t15": ["short-lesson"],
    "t30": ["medium-lesson"],
    "t60": ["long-lesson"]
  },
  "gear": {
    "acoustic": ["acoustic"],
    "electric": ["electric"],
    "none":     ["prep", "no-guitar"]
  }
}


def answers_to_goals(answers: dict) -> list:
    """ Hợp nhất goals từ tất cả câu trả lời (multi-select ở key 'basic'). """
    goals = []
    for qk, ok in (answers or {}).items():
        if qk == "basic" and isinstance(ok, list):
            for choice in ok:
                goals += ANSWER_GOALS_MAP.get(qk, {}).get(choice, [])
        else:
            goals += ANSWER_GOALS_MAP.get(qk, {}).get(ok, [])
    out = []
    for g in goals:
        if g and g not in out:
            out.append(g)
    return out


def infer_max_level(answers: dict) -> int:
    """
    Suy maxLevel (1..3) từ câu trả lời 'exp' + số kỹ năng 'basic' đã tick.
    """
    exp = (answers or {}).get("exp")
    basics = set((answers or {}).get("basic") or [])

    if exp in ("brand_new", None):
        level = 1
    elif exp == "touched":
        level = 1
    elif exp == "some_basics":
        level = 2
    else:
        level = 1

    if "barre_try" in basics and len(basics) >= 3:
        level = max(level, 3)
    elif len(basics) >= 3:
        level = max(level, 2)

    return max(1, min(level, 3))
