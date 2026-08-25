import json, re, urllib.parse, urllib.request, xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime

QUERIES=[
 ('해외연예','celebrity OR wedding OR dating OR breakup OR concert OR viral when:1d'),
 ('해외토픽','bizarre OR unusual OR rescue OR survival OR record OR viral when:1d'),
 ('동물','animal OR dog OR cat OR bear OR snake OR rescue OR rare when:1d'),
]
HEAD={'User-Agent':'Mozilla/5.0 NO-WAY-FACTORY/1.0'}

def fetch(q):
    u='https://news.google.com/rss/search?'+urllib.parse.urlencode({'q':q,'hl':'en-US','gl':'US','ceid':'US:en'})
    req=urllib.request.Request(u,headers=HEAD)
    with urllib.request.urlopen(req,timeout=25) as r:
        return r.read()

def clean_title(t):
    t=re.sub(r'\s+-\s+[^-]{2,60}$','',t or '').strip()
    return re.sub(r'\s+',' ',t)

def score(t):
    s=27
    for pat in ['wedding','married','dating','breakup','viral','rescue','survival','rare','record','bizarre','animal','concert','unexpected','found']:
        if pat in t.lower(): s+=1
    return min(30,s)

def main():
    out=[]; seen=set(); cut=datetime.now(timezone.utc)-timedelta(hours=36)
    for cat,q in QUERIES:
        try: root=ET.fromstring(fetch(q))
        except Exception as e:
            print(e); continue
        for it in root.findall('.//item'):
            title=clean_title(it.findtext('title','')); link=it.findtext('link',''); pub=it.findtext('pubDate','')
            if not title or title.lower() in seen: continue
            try:
                d=parsedate_to_datetime(pub)
                if d.tzinfo is None: d=d.replace(tzinfo=timezone.utc)
                if d<cut: continue
            except Exception: pass
            seen.add(title.lower())
            out.append({'id':re.sub(r'[^a-z0-9]+','-',title.lower())[:60].strip('-'),'title':title,'source':link,'publishedAt':pub,'cat':cat,'score':score(title),'visualScore':4})
    out=sorted(out,key=lambda x:x['score'],reverse=True)[:40]
    with open('radar-feed.json','w',encoding='utf-8') as f:
        json.dump(out,f,ensure_ascii=False,indent=2)

if __name__=='__main__':
    main()
