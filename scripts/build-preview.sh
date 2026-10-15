#!/bin/sh
# Builds a design preview (sample calendar, no payments) into ./preview
set -e
cd "$(dirname "$0")/.."
rm -rf preview && mkdir -p preview
cp -r site/css site/js preview/ && cp -r shared preview/shared && cp scripts/demo-data.js preview/js/demo-data.js
for f in index stay thanks; do
  sed -e 's#stay.html?unit=#stay.html\##g' \
      -e 's#<link rel="stylesheet" href="css/site.css">#<link rel="stylesheet" href="css/site.css"><script src="js/demo-data.js"></script>#' \
      site/$f.html > preview/$f.html
done
# The preview's front page is wrapped by the viewer, so drop the document shell there.
python3 - <<'PY'
import re
s=open('preview/index.html').read()
s=re.sub(r'<!doctype html>\s*<html[^>]*>\s*<head>\s*','',s,flags=re.I)
s=re.sub(r'<meta charset[^>]*>\s*<meta name="viewport"[^>]*>\s*','<meta name="claude:viewport-fit-sides" content="cover">\n',s)
s=s.replace('</head>','').replace('<body>','').replace('</body>','').replace('</html>','')
open('preview/index.html','w').write(s)
PY
echo built
