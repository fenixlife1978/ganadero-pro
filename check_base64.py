import re

with open(r'C:\SISTEMAS_VARIOS\gandero_pro_v1\ganadero_pro_v1.html', 'r', encoding='utf-8') as f:
    content = f.read()
    lines = content.split('\n')

count = 0
for i, line in enumerate(lines):
    if 'base64,' in line and 'ref-nav-icon' in line:
        b64_start = line.find('base64,') + 7
        b64 = line[b64_start:]
        is_truncated = '</button>' in b64 or '</span>' in b64
        has_png_end = '==' in b64[:200]
        page_match = re.search(r'data-page="([^"]+)"', line)
        page = page_match.group(1) if page_match else 'no-page'
        print('Line %d: b64_len=%d, truncated=%s, has_png_end=%s, page=%s' % (i+1, len(b64), is_truncated, has_png_end, page))
        count += 1

print('Total nav icons with base64:', count)
