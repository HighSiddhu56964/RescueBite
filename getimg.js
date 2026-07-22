fetch('https://ibb.co/QFQ1LDSq').then(r=>r.text()).then(t=>{ const m=t.match(/og:image.s*content=.([^."']+)/); if(m) require('fs').writeFileSync('imgurl.txt', m[1]); })
