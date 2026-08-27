"""Pure-Python PNG icon generator for GANADERO ERP sidebar icons."""
import zlib, base64, struct, json

def make_png(width, height, rgba_rows):
    def chunk(tag, data):
        crc = zlib.crc32(tag + data) & 0xffffffff
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', crc)
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    raw = b''.join(b'\x00' + bytes(row) for row in rgba_rows)
    idat = chunk(b'IDAT', zlib.compress(raw, 9))
    iend = chunk(b'IEND', b'')
    return sig + ihdr + idat + iend

class Draw:
    def __init__(self, rows):
        self.rows = rows
    def px(self, x, y, w, h, c):
        for r in range(y, y+h):
            if 0 <= r < len(self.rows):
                row = self.rows[r]
                for col in range(x, x+w):
                    if 0 <= col < len(row)//4:
                        row[col*4:(col*4)+4] = list(c)
    def circle(self, cx, cy, radius, color):
        for y in range(max(0, cy-radius-1), min(len(self.rows), cy+radius+1)):
            row = self.rows[y]
            for x in range(max(0, cx-radius-1), min(len(row)//4, cx+radius+1)):
                if (x-cx)*(x-cx) + (y-cy)*(y-cy) <= radius*radius:
                    row[x*4:(x+1)*4] = list(color)
    def fill(self, c):
        for row in self.rows:
            for i in range(0, len(row), 4):
                row[i:i+4] = list(c)

def make_icon(fn):
    rows = [[0,0,0,0] * 32 for _ in range(32)]  # 32 pixels × 4 channels = 128 per row
    d = Draw(rows)
    fn(d)
    return make_png(32, 32, rows)

G = [117, 213, 31, 255]
W = [240, 240, 240, 255]
B = [40, 40, 40, 255]
BG = [200, 200, 200, 255]
GR = [60, 130, 15, 255]
Y = [228, 197, 46, 255]
R = [220, 60, 60, 255]
BL = [84, 126, 209, 255]
P = [142, 85, 185, 255]
BR = [120, 80, 40, 255]

icons = {}

def draw_dashboard(d):
    d.fill([0,0,0,0])
    d.px(4, 6, 24, 4, G); d.px(4, 6, 5, 20, G)
    d.px(13, 6, 5, 16, G); d.px(22, 6, 5, 12, G)
    d.px(4, 26, 24, 3, G)

icons['dashboard'] = make_icon(draw_dashboard)

def draw_cow(d):
    d.fill([0,0,0,0])
    d.px(6, 12, 20, 12, G); d.px(2, 8, 10, 12, G)
    d.px(2, 6, 4, 4, G); d.px(6, 6, 4, 4, G)
    d.px(24, 10, 3, 14, G); d.px(8, 24, 4, 6, G)
    d.px(20, 24, 4, 6, G); d.px(4, 12, 3, 3, B)
    d.px(14, 14, 6, 4, GR); d.px(20, 16, 4, 5, GR)

icons['animales'] = make_icon(draw_cow)

def draw_pasture(d):
    d.fill([0,0,0,0])
    d.px(2, 24, 28, 5, GR)
    for x in range(3, 28, 4): d.px(x, 18, 3, 8, G); d.px(x+1, 16, 1, 4, G)
    d.px(13, 12, 6, 14, BR); d.px(9, 4, 14, 10, G); d.px(11, 2, 10, 4, G)

icons['potreros'] = make_icon(draw_pasture)

def draw_medical(d):
    d.fill([0,0,0,0])
    d.circle(16, 16, 13, R); d.px(14, 4, 4, 24, W); d.px(6, 12, 20, 4, W)

icons['sanidad'] = make_icon(draw_medical)

def draw_repro(d):
    d.fill([0,0,0,0])
    d.px(8, 4, 3, 24, G); d.px(21, 4, 3, 24, P)
    for y in range(4, 28, 5): d.px(8, y, 16, 3, G)
    d.circle(9, 8, 3, G); d.circle(22, 13, 3, P)
    d.circle(9, 18, 3, G); d.circle(22, 23, 3, P)

icons['reproduccion'] = make_icon(draw_repro)

def draw_food(d):
    d.fill([0,0,0,0])
    d.px(14, 18, 4, 12, Y)
    for dy in range(0, 10, 3): d.px(11, 17-dy, 4, 3, Y); d.px(17, 15-dy, 4, 3, Y)
    d.px(4, 26, 24, 4, GR)

icons['alimentacion'] = make_icon(draw_food)

def draw_milk(d):
    d.fill([0,0,0,0])
    d.px(8, 14, 16, 14, BL); d.px(10, 12, 12, 4, BL)
    d.px(10, 16, 12, 10, W); d.px(12, 30, 3, 4, W)
    d.px(17, 30, 3, 4, W); d.px(10, 12, 12, 3, W); d.px(9, 11, 14, 2, W)

icons['produccion'] = make_icon(draw_milk)

def draw_movements(d):
    d.fill([0,0,0,0])
    d.px(4, 13, 12, 6, G); d.px(4, 9, 6, 4, G); d.px(4, 17, 6, 4, G)
    d.px(16, 13, 12, 6, G); d.px(22, 9, 6, 4, G); d.px(22, 17, 6, 4, G)

icons['movimientos'] = make_icon(draw_movements)

def draw_reports(d):
    d.fill([0,0,0,0])
    d.px(6, 4, 20, 26, W); d.px(6, 4, 20, 4, G)
    for y in range(8, 26, 4): d.px(9, y, 14, 2, G)

icons['reportes'] = make_icon(draw_reports)

def draw_inventory(d):
    d.fill([0,0,0,0])
    d.px(4, 14, 24, 14, G); d.px(4, 10, 11, 6, G)
    d.px(17, 10, 11, 6, G); d.px(14, 14, 4, 14, GR); d.px(6, 6, 20, 4, GR)

icons['inventario'] = make_icon(draw_inventory)

def draw_finance(d):
    d.fill([0,0,0,0])
    d.circle(16, 22, 9, Y); d.circle(16, 22, 6, [200,170,30,255])
    d.circle(16, 16, 8, Y); d.circle(16, 16, 5, [200,170,30,255])
    d.circle(16, 10, 7, Y); d.circle(16, 10, 4, [200,170,30,255])
    d.px(15, 6, 2, 10, G); d.px(12, 8, 8, 2, G); d.px(12, 12, 8, 2, G)

icons['finanzas'] = make_icon(draw_finance)

def draw_users(d):
    d.fill([0,0,0,0])
    d.circle(16, 10, 5, G); d.px(10, 16, 12, 14, G)
    d.circle(8, 20, 3, G); d.px(5, 23, 6, 7, G)
    d.circle(24, 20, 3, G); d.px(21, 23, 6, 7, G)

icons['usuarios'] = make_icon(draw_users)

def draw_settings(d):
    import math
    d.fill([0,0,0,0])
    for angle in range(0, 360, 30):
        rad = math.radians(angle)
        for r in range(10, 14):
            x = int(16 + r * math.cos(rad)); y = int(16 + r * math.sin(rad))
            if 0 <= x < 32 and 0 <= y < 32: d.px(x, y, 1, 1, G)
    d.circle(16, 16, 6, G)
    d.px(14, 14, 4, 4, B)

icons['configuracion'] = make_icon(draw_settings)

def draw_hato(d):
    d.fill([0,0,0,0])
    d.circle(16, 18, 9, G); d.px(22, 12, 7, 10, G)
    d.px(26, 10, 4, 4, G); d.px(10, 26, 4, 6, G); d.px(18, 26, 4, 6, G)
    d.px(25, 14, 2, 2, B)
    d.circle(13, 14, 3, GR); d.circle(19, 16, 3, GR); d.circle(16, 20, 3, GR)

icons['hato'] = make_icon(draw_hato)

def draw_scale(d):
    d.fill([0,0,0,0])
    d.px(2, 14, 28, 4, G); d.px(14, 18, 4, 10, G); d.px(10, 26, 12, 3, G)
    d.px(2, 18, 12, 3, G); d.px(3, 21, 10, 8, BG)
    d.px(18, 18, 12, 3, G); d.px(19, 21, 10, 8, BG)
    d.px(15, 8, 2, 6, G)

icons['pesajes'] = make_icon(draw_scale)

def draw_tractor(d):
    d.fill([0,0,0,0])
    d.px(6, 12, 18, 10, Y); d.px(16, 6, 10, 8, Y)
    d.px(18, 8, 6, 4, [150,220,255,255]); d.px(14, 4, 2, 8, [100,100,100,255])
    d.circle(8, 24, 7, B); d.circle(8, 24, 4, [80,80,80,255])
    d.circle(22, 26, 4, B); d.circle(22, 26, 2, [80,80,80,255])
    d.px(2, 16, 4, 2, [100,100,100,255])

icons['maquinaria'] = make_icon(draw_tractor)

def draw_medicine(d):
    d.fill([0,0,0,0])
    d.px(6, 8, 14, 8, G); d.px(16, 10, 10, 4, BG)
    d.px(12, 18, 12, 6, G); d.px(18, 20, 10, 10, BG)
    d.px(20, 18, 6, 3, [180,180,180,255])
    d.px(22, 22, 2, 6, G); d.px(20, 24, 6, 2, G)

icons['medicamentos'] = make_icon(draw_medicine)

def draw_cart(d):
    d.fill([0,0,0,0])
    d.px(6, 12, 18, 12, G); d.px(22, 8, 4, 6, G); d.px(24, 8, 6, 3, G)
    d.circle(10, 26, 4, B); d.circle(22, 26, 4, B)
    d.px(6, 16, 18, 2, GR); d.px(6, 20, 18, 2, GR)

icons['compras'] = make_icon(draw_cart)

def draw_cash(d):
    d.fill([0,0,0,0])
    d.px(4, 10, 24, 14, G); d.px(6, 12, 20, 10, [90,170,20,255])
    d.circle(16, 17, 5, G); d.px(15, 13, 2, 8, [90,170,20,255])

icons['ventas'] = make_icon(draw_cash)

def draw_person(d):
    d.fill([0,0,0,0])
    d.circle(16, 10, 6, G); d.px(10, 18, 12, 12, G); d.px(6, 18, 20, 4, G)

icons['clientes'] = make_icon(draw_person)

def draw_factory(d):
    d.fill([0,0,0,0])
    d.px(4, 14, 20, 16, G); d.px(2, 12, 24, 4, G)
    d.px(7, 18, 4, 4, [200,230,255,255]); d.px(14, 18, 4, 4, [200,230,255,255])
    d.px(21, 18, 4, 4, [200,230,255,255]); d.px(13, 24, 6, 6, B)
    d.px(20, 4, 5, 10, G)
    d.circle(22, 2, 2, [180,180,180,255]); d.circle(24, 4, 2, [180,180,180,255])

icons['proveedores'] = make_icon(draw_factory)

def draw_backup(d):
    d.fill([0,0,0,0])
    d.circle(16, 16, 12, [60,60,60,255]); d.circle(16, 16, 9, [100,100,100,255])
    d.circle(16, 16, 4, [60,60,60,255]); d.px(16, 4, 2, 6, [40,40,40,255])
    d.px(24, 14, 6, 4, G); d.px(26, 12, 4, 3, G); d.px(26, 18, 4, 3, G)

icons['backups'] = make_icon(draw_backup)

def draw_audit(d):
    d.fill([0,0,0,0])
    d.px(8, 6, 16, 22, [220,220,200,255]); d.px(12, 4, 8, 4, G)
    for y in range(12, 26, 4): d.px(10, y, 12, 2, G)
    d.px(10, 8, 2, 4, G); d.px(8, 12, 4, 2, G)

icons['auditoria'] = make_icon(draw_audit)

def draw_document(d):
    d.fill([0,0,0,0])
    d.px(6, 4, 20, 26, W); d.px(22, 4, 4, 4, [200,200,200,255]); d.px(22, 8, 4, 4, [200,200,200,255])
    for y in range(10, 26, 4): d.px(9, y, 14, 2, G)
    d.px(9, 6, 10, 2, G)

icons['documentos'] = make_icon(draw_document)

# Save to JSON
result = {name: base64.b64encode(png).decode('ascii') for name, png in icons.items()}
with open(r'C:\SISTEMAS_VARIOS\gandero_pro_v1\icons_base64.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, indent=2)

for name, b64 in result.items():
    print(f'{name}: {len(b64)} chars')
print(f'Total: {len(result)} icons saved')
