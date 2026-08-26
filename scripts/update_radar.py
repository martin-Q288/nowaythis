import json, re, urllib.parse, urllib.request, xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime

# Benchmark learning v4: discovery is driven by repeatable viral patterns and
# now also searches for ARCHIVE + CURRENT PEG opportunities.
QUERIES = [
    ('해외연예', '("테일러 스위프트" OR "호날두" OR "메시" OR "저스틴 비버" OR "셀레나 고메즈" OR "젠데이아" OR "시드니 스위니" OR "톰 크루즈" OR "브래드 피트" OR "레오나르도 디카프리오" OR "홀란" OR "배드 버니") when:2d'),
    ('해외연예', '해외 연예 (결혼 OR 약혼 OR 열애 OR 이별 OR 복귀 OR 최초 OR 기록 OR 깜짝 OR 화제) when:2d'),
    ('아카이브재소환', '("과거 영상" OR "과거 발언" OR "예전 영상" OR "재조명" OR "재소환" OR "다시 화제") (해외 OR 스타 OR 선수 OR 배우 OR 가수) when:2d'),
    ('아카이브재소환', '("old video" OR "old clip" OR "past interview" OR "old comments" OR resurfaces OR throwback) ("Taylor Swift" OR Ronaldo OR Messi OR "Justin Bieber" OR Zendaya OR "Tom Cruise" OR "Brad Pitt" OR Haaland OR "Bad Bunny") when:2d'),
    ('해외토픽', '해외 (기묘 OR 충격 OR 화제 OR 바이럴 OR 발견 OR 기록 OR 희귀) when:2d'),
    ('동물', '해외 동물 (구조 OR 갇힌 OR 화재 OR 발견 OR 희귀 OR 생존 OR 영상) when:2d'),
    ('동물', '(강아지 OR 고양이 OR 곰 OR 뱀 OR 고래 OR 상어 OR 기린 OR 코끼리) (구조 OR 발견 OR 화제 OR 생존) 해외 when:2d'),
    ('휴먼', '해외 (구조 OR 구한 OR 선행 OR 영웅 OR 감동 OR 생존) (영상 OR 화제 OR 바이럴) when:2d'),
    ('기술과학', '해외 (로봇 OR AI OR 인공지능 OR 발명 OR 기술 OR 과학 OR 우주 OR 유전자 OR 3D) (화제 OR 공개 OR 최초 OR 기록 OR 영상) when:2d'),
    ('스포츠휴먼', '해외 스포츠 (감동 OR 가족 OR 도움 OR 구조 OR 깜짝 OR 바이럴 OR 기록) when:2d'),
    ('글로벌팝', '(KATSEYE OR BTS OR BLACKPINK OR "브루노 마스" OR "빌리 아일리시" OR "레이디 가가" OR "두아 리파" OR "아리아나 그란데" OR "배드 버니") when:2d'),
]

POSITIVE = re.compile(r'(결혼|열애|이별|약혼|복귀|최초|기록|공연|콘서트|파격|깜짝|화제|바이럴|기묘|충격|희귀|구조|구한|선행|감동|생존|발견|동물|강아지|고양이|곰|뱀|고래|상어|기린|코끼리|로봇|AI|인공지능|발명|과학|기술|우주|유전자|과거 영상|과거 발언|예전 영상|재조명|재소환|다시 화제|celebrity|wedding|dating|breakup|record|first|viral|bizarre|rare|rescue|saved|survival|animal|robot|science|technology|found|old video|old clip|past interview|old comments|resurfaces|throwback|Taylor|Swift|Ronaldo|Messi|Bieber|Gomez|Zendaya|Sweeney|Haaland|Bad Bunny|KATSEYE|BTS|BLACKPINK)', re.I)
NEGATIVE = re.compile(r'(정치|정부|정책|대통령|국회|선거|경제|증시|부동산|교육정책|복지정책|칼럼|사설|오피니언|정당|후보|policy|government|president|election|column|opinion|advocate|council|funding|system|bingo|calendar|schedule)', re.I)
HEAD = {'User-Agent': 'Mozilla/5.0 NO-WAY-FACTORY/1.0'}

KNOWN = re.compile(r'(테일러 스위프트|호날두|메시|저스틴 비버|셀레나 고메즈|젠데이아|시드니 스위니|톰 크루즈|브래드 피트|레오나르도 디카프리오|킴 카다시안|카일리 제너|홀란|음바페|배드 버니|비욘세|아리아나 그란데|KATSEYE|BTS|BLACKPINK|브루노 마스|빌리 아일리시|레이디 가가|두아 리파|Taylor Swift|Ronaldo|Messi|Justin Bieber|Selena Gomez|Zendaya|Sydney Sweeney|Tom Cruise|Brad Pitt|Leonardo DiCaprio|Kim Kardashian|Kylie Jenner|Haaland|Mbappe|Bad Bunny|Beyonce|Ariana Grande)', re.I)
CHANGE = re.compile(r'(최초|기록|번째|년 만|생일|결혼|약혼|열애|이별|복귀|변신|헤어|삭발|금발|공개|출연|캐스팅|우승|수상|팔로워|증가|은퇴|first|record|birthday|wedding|engag|dating|breakup|return|debut|wins?|award|retir|million|billion|%|\d)', re.I)
ARCHIVE = re.compile(r'(과거|예전|당시|재조명|재소환|다시 화제|몇 년 전|옛 영상|옛날 영상|과거 영상|과거 발언|old (video|clip|interview|comments?)|throwback|resurfac|years ago|from 20\d\d)', re.I)
DANGER = re.compile(r'(구조|구했다|구한|구해|갇힌|불길|화재|익사|물에 빠|추락|생존|실종|위기|rescue|saved?|trapped|fire|drown|surviv|stuck)', re.I)
ANIMAL = re.compile(r'(강아지|고양이|곰|뱀|고래|상어|기린|코끼리|동물|반려견|puppy|dog|cat|bear|snake|whale|shark|giraffe|elephant|animal)', re.I)
WEIRD = re.compile(r'(기묘|정체불명|희귀|이상한|괴상|미스터리|처음 보는|발견|실제로|bizarre|weird|strange|mysterious|rare|odd|found)', re.I)
TECH = re.compile(r'(AI|로봇|기술|과학|우주|세포|유전자|엔지니어|발명|3D|인공지능|robot|science|space|cell|gene|engineer|technology|invention)', re.I)
RESULT = re.compile(r'(순간|장면|영상|결국|직접|점프|올라탄|뛰어|무너|폭발|실수|moment|video|jumps?|falls?|crash|caught)', re.I)

PATTERN_BONUS = {
    'RECOGNITION + CHANGE': 3,
    'DANGER → PAYOFF': 3,
    'WEIRD BUT TRUE': 2,
    'WHAT + WHY WOW': 2,
    'RESULT FIRST': 2,
    'VISUAL FIRST': 1,
    'ARCHIVE + CURRENT PEG': 1,
    'COMPLETE FACT': 1,
}


def fetch(q):
    u = 'https://news.google.com/rss/search?' + urllib.parse.urlencode({
        'q': q, 'hl': 'ko', 'gl': 'KR', 'ceid': 'KR:ko'
    })
    req = urllib.request.Request(u, headers=HEAD)
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read()


def clean_title(t):
    t = re.sub(r'\s+-\s+[^-]{2,80}$', '', t or '').strip()
    return re.sub(r'\s+', ' ', t)


def hours_old(pub):
    try:
        d = parsedate_to_datetime(pub)
        if d.tzinfo is None:
            d = d.replace(tzinfo=timezone.utc)
        return max(0.0, (datetime.now(timezone.utc) - d).total_seconds() / 3600)
    except Exception:
        return 24.0


def infer_pattern(title, cat):
    t = f'{title} {cat}'
    if ARCHIVE.search(t) and (KNOWN.search(t) or CHANGE.search(t)):
        return 'ARCHIVE + CURRENT PEG'
    if DANGER.search(t) and (ANIMAL.search(t) or re.search(r'(사람|남성|여성|아이|아버지|어머니|man|woman|child)', t, re.I)):
        return 'DANGER → PAYOFF'
    if KNOWN.search(t) and CHANGE.search(t):
        return 'RECOGNITION + CHANGE'
    if TECH.search(t):
        return 'WHAT + WHY WOW'
    if WEIRD.search(t):
        return 'WEIRD BUT TRUE'
    if RESULT.search(t):
        return 'RESULT FIRST'
    if cat in ('동물', '스포츠휴먼'):
        return 'VISUAL FIRST'
    return 'COMPLETE FACT'


def korea_awareness(title, cat):
    if KNOWN.search(title):
        return 5
    if cat in ('동물', '휴먼') or ANIMAL.search(title):
        return 4
    if cat in ('해외토픽', '기술과학', '스포츠휴먼') and (WEIRD.search(title) or TECH.search(title) or RESULT.search(title)):
        return 4
    if cat == '아카이브재소환' and ARCHIVE.search(title):
        return 4
    return 3


def visual_score(title, cat, pattern):
    if pattern in ('DANGER → PAYOFF', 'RESULT FIRST', 'VISUAL FIRST'):
        return 5
    if pattern in ('WEIRD BUT TRUE', 'WHAT + WHY WOW', 'ARCHIVE + CURRENT PEG'):
        return 4
    if cat in ('동물', '휴먼', '스포츠휴먼'):
        return 5
    return 4


def pattern_mode(pattern):
    return 'VISUAL-FIRST' if pattern in ('DANGER → PAYOFF', 'RESULT FIRST', 'VISUAL FIRST', 'WHAT + WHY WOW') else 'HEADLINE-FIRST'


def format_recommendation(pattern):
    if pattern in ('DANGER → PAYOFF', 'RESULT FIRST', 'VISUAL FIRST'):
        return 'REELS 우선'
    if pattern == 'COMPLETE FACT':
        return 'CAROUSEL 강함'
    return 'REELS + CAROUSEL'


def score(title, pub, cat, pattern):
    s = 23
    h = hours_old(pub)
    if h <= 6:
        s += 3
    elif h <= 12:
        s += 2
    elif h <= 24:
        s += 1
    if KNOWN.search(title):
        s += 2
    s += PATTERN_BONUS.get(pattern, 0)
    if cat in ('동물', '휴먼', '해외토픽'):
        s += 1
    return min(30, s)


def main():
    out = []
    seen = set()
    cut = datetime.now(timezone.utc) - timedelta(hours=50)

    for cat, q in QUERIES:
        try:
            root = ET.fromstring(fetch(q))
        except Exception as e:
            print('fetch failed:', cat, e)
            continue

        for it in root.findall('.//item'):
            title = clean_title(it.findtext('title', ''))
            link = it.findtext('link', '')
            pub = it.findtext('pubDate', '')
            source_el = it.find('source')
            publisher = (source_el.text or '').strip() if source_el is not None else ''

            if not title or title.lower() in seen or NEGATIVE.search(title):
                continue
            if not POSITIVE.search(title) and not KNOWN.search(title):
                continue

            try:
                d = parsedate_to_datetime(pub)
                if d.tzinfo is None:
                    d = d.replace(tzinfo=timezone.utc)
                if d < cut:
                    continue
            except Exception:
                pass

            pattern = infer_pattern(title, cat)
            awareness = korea_awareness(title, cat)
            visual = visual_score(title, cat, pattern)
            seen.add(title.lower())
            out.append({
                'id': re.sub(r'[^a-z0-9가-힣]+', '-', title.lower())[:70].strip('-'),
                'title': title,
                'titleKr': title,
                'source': link,
                'publisher': publisher,
                'publishedAt': pub,
                'cat': '해외연예' if cat in ('해외연예', '글로벌팝') else cat,
                'score': score(title, pub, cat, pattern),
                'visualScore': visual,
                'koreaAwareness': awareness,
                'patternCode': pattern,
                'patternConfidence': 93 if pattern == 'ARCHIVE + CURRENT PEG' else (92 if pattern in ('DANGER → PAYOFF', 'RECOGNITION + CHANGE') else 82),
                'visualMode': pattern_mode(pattern),
                'formatRecommendation': format_recommendation(pattern),
                'archiveContext': pattern == 'ARCHIVE + CURRENT PEG',
                'benchmarkVersion': '500ch-v4',
            })

    out = sorted(out, key=lambda x: (x['score'], x['koreaAwareness'], x['visualScore'], -hours_old(x['publishedAt'])), reverse=True)[:120]
    with open('radar-feed.json', 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print('radar candidates:', len(out))


if __name__ == '__main__':
    main()
