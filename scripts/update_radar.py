import json, re, urllib.parse, urllib.request, xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime

# Google News treats plain space-separated terms too narrowly. Use explicit OR groups
# and several small searches so the feed always has enough timely candidates.
QUERIES = [
    ('해외연예', '("테일러 스위프트" OR "호날두" OR "메시" OR "저스틴 비버" OR "셀레나 고메즈" OR "젠데이아" OR "시드니 스위니" OR "톰 크루즈" OR "브래드 피트" OR "레오나르도 디카프리오" OR "킴 카다시안" OR "카일리 제너") when:2d'),
    ('해외연예', '해외 연예 (결혼 OR 약혼 OR 열애 OR 이별 OR 공연 OR 콘서트 OR 파격 OR 깜짝 OR 화제) when:2d'),
    ('해외토픽', '해외 (기묘 OR 충격 OR 화제 OR 바이럴 OR 발견 OR 기록 OR 구조 OR 생존 OR 희귀) when:2d'),
    ('동물', '해외 동물 (구조 OR 발견 OR 화제 OR 희귀 OR 생존 OR 영상) when:2d'),
    ('동물', '(강아지 OR 고양이 OR 곰 OR 뱀 OR 고래 OR 상어 OR 기린) (구조 OR 발견 OR 화제) 해외 when:2d'),
    ('글로벌팝', '(KATSEYE OR BTS OR BLACKPINK OR "브루노 마스" OR "빌리 아일리시" OR "레이디 가가" OR "두아 리파") when:2d'),
]

POSITIVE = re.compile(r'(결혼|열애|이별|약혼|공연|콘서트|파격|깜짝|화제|바이럴|기묘|충격|희귀|구조|생존|기록|발견|동물|강아지|고양이|곰|뱀|고래|상어|기린|celebrity|wedding|dating|breakup|concert|viral|bizarre|rare|rescue|survival|record|animal|found|Taylor|Swift|Ronaldo|Messi|Bieber|Gomez|Zendaya|Sweeney|KATSEYE|BTS|BLACKPINK)', re.I)
NEGATIVE = re.compile(r'(정치|정부|정책|대통령|국회|선거|경제|증시|부동산|교육정책|복지정책|칼럼|사설|오피니언|정당|후보|policy|government|president|election|column|opinion|advocate|council|funding|system|bingo|calendar|schedule)', re.I)
HEAD = {'User-Agent': 'Mozilla/5.0 NO-WAY-FACTORY/1.0'}

KNOWN = re.compile(r'(테일러 스위프트|호날두|메시|저스틴 비버|셀레나 고메즈|젠데이아|시드니 스위니|톰 크루즈|브래드 피트|레오나르도 디카프리오|킴 카다시안|카일리 제너|KATSEYE|BTS|BLACKPINK|브루노 마스|빌리 아일리시|레이디 가가|두아 리파|Taylor Swift|Ronaldo|Messi|Justin Bieber|Selena Gomez|Zendaya|Sydney Sweeney|Tom Cruise|Brad Pitt|Leonardo DiCaprio|Kim Kardashian|Kylie Jenner)', re.I)


def fetch(q):
    u = 'https://news.google.com/rss/search?' + urllib.parse.urlencode({
        'q': q, 'hl': 'ko', 'gl': 'KR', 'ceid': 'KR:ko'
    })
    req = urllib.request.Request(u, headers=HEAD)
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read()


def clean_title(t):
    # Google News titles usually end in " - publisher".
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


def score(title, pub, cat):
    s = 25
    h = hours_old(pub)
    if h <= 6: s += 3
    elif h <= 12: s += 2
    elif h <= 24: s += 1
    if KNOWN.search(title): s += 2
    for pat in ['결혼','열애','이별','약혼','파격','깜짝','희귀','구조','생존','기록','발견','충격','바이럴','concert','viral','bizarre','rare','rescue','record']:
        if pat.lower() in title.lower(): s += 1
    if cat in ('동물','해외토픽'): s += 1
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
            # Famous-person queries may not contain one of the event words, so known names pass too.
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

            seen.add(title.lower())
            out.append({
                'id': re.sub(r'[^a-z0-9가-힣]+', '-', title.lower())[:70].strip('-'),
                'title': title,
                'titleKr': title,
                'source': link,
                'publisher': publisher,
                'publishedAt': pub,
                'cat': '해외연예' if cat in ('해외연예','글로벌팝') else cat,
                'score': score(title, pub, cat),
                'visualScore': 4,
                'koreaAwareness': 5 if KNOWN.search(title) else 4,
            })

    # newest/highest score first, keep a large pool so manual discovery can always pull 10.
    out = sorted(out, key=lambda x: (x['score'], -hours_old(x['publishedAt'])), reverse=True)[:80]
    with open('radar-feed.json', 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print('radar candidates:', len(out))


if __name__ == '__main__':
    main()
