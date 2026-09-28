"""Only generate the official QR after a fixed, public Production URL is verified."""
from pathlib import Path
from urllib.parse import urlparse
import ipaddress
import json
import math
import qrcode

root = Path(__file__).resolve().parent.parent
config = json.loads((root / 'deployment' / 'production.json').read_text(encoding='utf-8-sig'))
url = config.get('productionUrl', '')
parsed = urlparse(url)
if config.get('verifiedPublicProduction') is not True or not config.get('vercelProjectName'):
    raise SystemExit('先确认 Vercel 项目的固定 Production URL，并在 production.json 记录验证结果。禁止使用 Preview 地址。')
if parsed.scheme != 'https' or not parsed.hostname or '.' not in parsed.hostname or parsed.username or parsed.password or parsed.port or parsed.query or parsed.fragment or parsed.path not in ('', '/'):
    raise SystemExit('正式二维码只接受已验证的公网 HTTPS 根地址。')
try:
    ipaddress.ip_address(parsed.hostname)
except ValueError:
    pass
else:
    raise SystemExit('正式二维码必须使用固定域名，不使用 IP 地址。')
if parsed.hostname.endswith(('.local', '.localhost', '.internal')):
    raise SystemExit('不能使用本地域名。')
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=6)
qr.add_data(url)
qr.make(fit=True)
qr.box_size = math.ceil(2048 / (qr.modules_count + 12))
target = root / '绞一纹-H5二维码.png'
qr.make_image(fill_color='black', back_color='white').save(target)
print(f'{target}\n{url}\n固定生产域名不变时，无需重新生成二维码。')
