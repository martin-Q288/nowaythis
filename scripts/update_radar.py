import json, re, urllib.parse, urllib.request, xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime

QUERIES=[
 ('해외연예','해외 연예인 결혼 열애 이별 공연 파격 화제 when:1d'),
 ('해외토픽','해외토픽 기묘 구조 생존 희귀 기록 영상 화제 when:1d'),
 ('동물','해외 희귀 동물 구조 곰 뱀 고래 강아지 화제 when:1d'),
]
POSITIVE=re.compile(r'(결혼|열애|이별|약혼|공연|콘서트|파격|깜짝|화제|바이럴|기묘|희귀|구조|생존|기록|발견|동물|강아지|고양이|곰|뱀|고래|celebrity|wedding|dating|breakup|concert|viral|bizarre|rare|rescue|survival|record|animal|found)',re.I)
NEGATIVE=re.compile(r'(정치|정부|정책|대통령|국회|선거|경제|증시|부동산|교육정책|복지정책|칼럼|사설|오피니언|정당|후보|policy|government|president|election|column|opinion|advocate|council|funding|system|bingo|calendar|schedule)',re.I)
HEAD={'User-Agent':'Mozilla/5.0 NO-WAY-FACTORY/1.0'}

def fetch(q):
    u='https://news.google.com/rss/search?'+urllib.parse.urlencode({'q':q,'hl':'ko','gl':'KR','ceid':'KR:ko'})
    req=urllib.request.Request(u,headers=HEAD)
    with urllib.request.urlopen(req,timeout=25) as r:
        return r.read()

def clean_title(t):
    t=re.sub(r'\s+-\s+[^-]{2,60}$','',t or '').strip()
    return re.sub(r'\s+',' ',t)

def score(t):
    s=27
    for pat in ['결혼','열애','이별','약혼','파격','깜짝','희귀','구조','생존','기록','발견','viral','bizarre','rare','rescue','record','concert']:
        if pat.lower() in t.lower(): s+=1
    return min(30,s)

def main():
    out=[]; seen=set(); cut=datetime.now(timezone.utc)-timedelta(hours=30)
    for cat,q in QUERIES:
        try: root=ET.fromstring(fetch(q))
        except Exception as e:
            print(e); continue
        for it in root.findall('.//item'):
            title=clean_title(it.findtext('title','')); link=it.findtext('link',''); pub=it.findtext('pubDate','')
            if not title or title.lower() in seen or NEGATIVE.search(title) or not POSITIVE.search(title): continue
            try:
                d=parsedate_to_datetime(pub)
                if d.tzinfo is None: d=d.replace(tzinfo=timezone.utc)
                if d<cut: continue
            except Exception: pass
            seen.add(title.lower())
            out.append({'id':re.sub(r'[^a-z0-9가-힣]+','-',title.lower())[:70].strip('-'),'title':title,'source':link,'publishedAt':pub,'cat':cat,'score':score(title),'visualScore':4})
    out=sorted(out,key=lambda x:(x['score'],x['publishedAt']),reverse=True)[:30]
    with open('radar-feed.json','w',encoding='utf-8') as f:
        json.dump(out,f,ensure_ascii=False,indent=2)

if __name__=='__main__':
    main()
