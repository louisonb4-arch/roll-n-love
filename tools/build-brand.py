#!/usr/bin/env python3
"""
Roll in Love — favicons et image de partage (Open Graph 1200×630).

    python3 tools/build-brand.py

Favicons : le O du logo (la spirale), sur fond crème pour les icônes d'écran
d'accueil. Image OG : crème, logo, phrase de la marque en Scripter, photo
du plateau ube en polaroïd.
"""
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
LIB = os.path.expanduser('~/Desktop/Projets/Actifs/Roll in Love/Photos')
O_SRC = f'{LIB}/logoroll_alternative.png'
LOGO = os.path.expanduser('~/roll-n-love/assets/images/src/logo.png')
PHOTO = f'{LIB}/f520502b-a1ba-4463-823b-1aaa08ae9181.JPG'
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


def og_image():
    W, H = 1200, 630
    im = Image.new('RGBA', (W, H), CREAM + (255,))
    d = ImageDraw.Draw(im)

    # polaroïd à droite
    photo = ImageOps.exif_transpose(Image.open(PHOTO)).convert('RGB')
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
    fd.text((22, ph + 30), 'UBÉ LATTE & ROLLS', font=ImageFont.truetype(FONT, 34), fill=BROWN)
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
    d.text((66, 70 + logo.height + 34), 'LE ROLL FOND,', font=f, fill=BROWN)
    d.text((66, 70 + logo.height + 104), 'LE CŒUR AUSSI.', font=f, fill=BROWN)
    d.text((68, H - 76), 'COFFEE SHOP & CINNAMON ROLLS · SAINT-JEAN-DE-MONTS', font=ImageFont.truetype(FONT, 26), fill=CINNAMON)
    im.convert('RGB').save(f'{ROOT}/assets/img/og-image.jpg', quality=86, optimize=True, progressive=True)


if __name__ == '__main__':
    favicons()
    og_image()
    print('favicons + og-image.jpg')
