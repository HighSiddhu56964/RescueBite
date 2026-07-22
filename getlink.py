import urllib.request, re
html = urllib.request.urlopen('https://ibb.co/1t1vZtKD').read().decode('utf-8')
print(re.search(r'property=.og:image.\s*content=.(.*?).>', html).group(1))
