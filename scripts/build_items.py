"""從題庫 Excel 產生網站使用的 assets/items.js。

用法：
    python3 scripts/build_items.py data/六合一人格職涯測驗題庫_v3.xlsx assets/items.js

讀取名稱以「完整題庫總表」開頭的工作表，欄位依序為：
題號、所屬題組、來源量表、英文原題、繁體中文翻譯、主要維度、計分方向、
大五映射、MBTI映射、HEXACO映射、DISC映射、依附類型映射、RIASEC映射。
映射格式為「維度 (+1.0)」或「-」。權重正號代表越同意分數越高，負號代表越同意分數越低。
"""
import json
import re
import sys

import openpyxl

src, out = sys.argv[1], sys.argv[2]
wb = openpyxl.load_workbook(src, data_only=True)
ws = next(w for w in wb.worksheets if w.title.startswith('完整題庫總表'))
COLS = {7: 'big5', 8: 'mbti', 9: 'hexaco', 10: 'disc', 11: 'ecr', 12: 'riasec'}
PAT = re.compile(r'^(\S+) \(([+-]\d+(?:\.\d+)?)\)$')

items, errors = [], []
for row in ws.iter_rows(min_row=2, values_only=True):
    if not row[0]:
        continue
    maps = []
    for ci, test in COLS.items():
        v = row[ci]
        if v in (None, '-', ''):
            continue
        m = PAT.match(str(v).strip())
        if not m:
            errors.append(f'{row[0]} 第 {ci + 1} 欄格式錯誤：{v}')
            continue
        maps.append([test, m.group(1), float(m.group(2))])
    if not maps:
        errors.append(f'{row[0]} 沒有任何計分映射')
    items.append({'id': row[0], 'g': row[1], 't': row[4], 'm': maps})

if errors:
    sys.exit('\n'.join(errors))

body = json.dumps(items, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
open(out, 'w', encoding='utf-8').write(
    '/* 由 scripts/build_items.py 從題庫 Excel 自動產生，請勿手動修改。 */\n'
    '(function (root) {\n'
    f'  const ITEMS = {body};\n'
    "  if (typeof module === 'object' && module.exports) module.exports = ITEMS; else root.INNER_ITEMS = ITEMS;\n"
    "})(typeof self !== 'undefined' ? self : this);\n")
print(f'已產生 {out}：{len(items)} 題、{sum(len(i["m"]) for i in items)} 個計分映射')
