#!/usr/bin/env python3
"""
Roll in Love — favicons et image de partage (Open Graph 1200×630).

    python3 tools/build-brand.py            # favicons + toutes les images OG
    python3 tools/build-brand.py rubriques  # seulement les OG des rubriques

Favicons : le O du logo (la spirale), sur fond crème pour les icônes d'écran
d'accueil. Image OG : crème, logo, phrase de la marque en Scripter, photo
en polaroïd (plateau ube pour l'accueil, une photo par rubrique).
"""
import sys
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
LIB = os.path.expanduser('~/Desktop/Projets/Actifs/Roll in Love/Photos')
O_SRC = f'{LIB}/logoroll_alternative.png'
LOGO = os.path.expanduser('~/roll-n-love/assets/images/src/logo.png')
PHOTO = f'{LIB}/f520502b-a1ba-4463-823b-1aaa08ae9181.JPG'
IG = f'{LIB}/Instagram-Facebook'
V2 = os.path.expanduser('~/rollinlove-site/assets/images')
# rubriques : photo publiée par la maison, légende du polaroïd, deux lignes de titre
RUBRIQUES = [
    ('og-brunch', f'{V2}/brunch-plateau.jpg', 'LE PLATEAU BRUNCH', ('LE BRUNCH,', 'SUR RÉSERVATION.')),
    ('og-cinnamon-rolls', f'{IG}/639468935_17848861188684224_9172572896023649567_n.jpg', 'ROULÉS MAIN', ('NOS CINNAMON', 'ROLLS.')),
    ('og-boissons', f'{IG}/669797994_17859381387684224_7567590828431093350_n.jpg', 'UBÉ LATTE GLACÉ', ('CAFÉ, MATCHA', '& UBÉ LATTE.')),
]
FONT = os.path.expanduser('~/Desktop/Projets/Actifs/Roll in Love/Fonts/Scripter-Regular.ttf')

CREAM = (255, 238, 220)
BROWN = (66, 32, 12)
CINNAMON = (154, 78, 28)
GLAZE = (255, 248, 239)


def the_o():
    im = Image.open(O_SRC).convert('RGBA')
    return im.crop(im.getbbox())


def square(img, size, pad=0.0, bg=None):
    canvas = Image.new('RGBA', (size, size), bg + (255,) if bg else (0, 0, 0, 0))
    inner = round(size * (1 - 2 * pad))
    o = img.copy()
    o.thumbnail((inner, inner), Image.LANCZOS)
    canvas.alpha_composite(o, ((size - o.width) // 2, (size - o.height) // 2))
    return canvas


def favicons():
    o = the_o()
    out = ROOT
    square(o, 32).save(f'{out}/favicon-32.png')
    square(o, 512, 0.0).save(f'{out}/assets/img/favicon-512.png')
    # .ico multi-tailles (16/32/48)
    square(o, 48).save(f'{out}/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
    # écran d'accueil : fond plein (iOS remplit le transparent en noir)
    square(o, 180, 0.1, CREAM).convert('RGB').save(f'{out}/apple-touch-icon.png')
    square(o, 192, 0.1, CREAM).save(f'{out}/assets/img/icon-192.png')
    square(o, 512, 0.1, CREAM).save(f'{out}/assets/img/icon-512.png')
    square(o, 512, 0.2, CREAM).save(f'{out}/assets/img/icon-maskable-512.png')


def og_image(photo_src=PHOTO, caption='UBÉ LATTE & ROLLS', lines=('LE ROLL FOND,', 'LE CŒUR AUSSI.'), name='og-image'):
    W, H = 1200, 630
    im = Image.new('RGBA', (W, H), CREAM + (255,))
    d = ImageDraw.Draw(im)

    # polaroïd à droite
    photo = ImageOps.exif_transpose(Image.open(photo_src)).convert('RGB')
    pw, ph = 380, 475
    r = photo.width / photo.height
    if r > pw / ph:
        nw = round(photo.height * pw / ph); photo = photo.crop(((photo.width - nw) // 2, 0, (photo.width + nw) // 2, photo.height))
    else:
        nh = round(photo.width * ph / pw); photo = photo.crop((0, (photo.height - nh) // 2, photo.width, (photo.height + nh) // 2))
    photo = photo.resize((pw, ph), Image.LANCZOS)
    frame = Image.new('RGBA', (pw + 28, ph + 92), GLAZE + (255,))
    frame.paste(photo, (14, 14))
    fd = ImageDraw.Draw(frame)
    fd.text((22, ph + 30), caption, font=ImageFont.truetype(FONT, 34), fill=BROWN)
    shadow = Image.new('RGBA', (frame.width + 80, frame.height + 80), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((40, 52, frame.width + 40, frame.height + 52), 10, fill=(66, 32, 12, 110))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    shadow = shadow.rotate(4, expand=True, resample=Image.BICUBIC)
    framed = frame.rotate(4, expand=True, resample=Image.BICUBIC)
    im.alpha_composite(shadow, (W - framed.width - 70 - 46, (H - framed.height) // 2 - 40))
    im.alpha_composite(framed, (W - framed.width - 70, (H - framed.height) // 2))

    # logo + phrase à gauche
    logo = Image.open(LOGO).convert('RGBA')
    logo = logo.crop(logo.getbbox())
    logo.thumbnail((560, 300), Image.LANCZOS)
    im.alpha_composite(logo, (64, 70))
    f = ImageFont.truetype(FONT, 66)
    d.text((66, 70 + logo.height + 34), lines[0], font=f, fill=BROWN)
    d.text((66, 70 + logo.height + 104), lines[1], font=f, fill=BROWN)
    d.text((68, H - 76), 'COFFEE SHOP & CINNAMON ROLLS · SAINT-JEAN-DE-MONTS', font=ImageFont.truetype(FONT, 26), fill=CINNAMON)
    im.convert('RGB').save(f'{ROOT}/assets/img/{name}.jpg', quality=86, optimize=True, progressive=True)


def og_rubriques():
    for name, src, caption, lines in RUBRIQUES:
        og_image(src, caption, lines, name)
        print(f'{name}.jpg')


if __name__ == '__main__':
    if sys.argv[1:] == ['rubriques']:
        og_rubriques()
    else:
        favicons()
        og_image()
        og_rubriques()
        print('favicons + og-image.jpg')
