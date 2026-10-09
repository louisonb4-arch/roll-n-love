#!/usr/bin/env python3
"""
Roll in Love — génération des images du site.

Lit les originaux de la bibliothèque de la marque (hors dépôt, trop lourds) et
écrit dans assets/img/ des déclinaisons AVIF + WebP en 3 largeurs, recadrées
par point focal. Relancer après tout changement de photo :

    python3 tools/build-images.py

Chaque entrée : clé de sortie, fichier source, ratio (largeur/hauteur, None =
ratio d'origine), point focal (fractions 0–1), largeurs voulues.
Les largeurs supérieures à la source sont ignorées : jamais d'agrandissement.
"""
import json
import os
import sys

from PIL import Image, ImageOps

LIB = os.path.expanduser('~/Desktop/Projets/Actifs/Roll in Love/Photos')
IG = os.path.join(LIB, 'Instagram-Facebook')
V2 = os.path.expanduser('~/rollinlove-site/assets/images')
SRC = os.path.join(os.path.dirname(__file__), 'sources', 'instagram')
CRE = os.path.join(os.path.dirname(__file__), 'sources', 'creations')
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'img')

W_STD = (480, 800, 1200)
W_SMALL = (320, 640)

# clé, source, ratio, focal (x, y), largeurs, crop absolu (x0, y0, x1, y1) prioritaire
MANIFEST = [
    # logos (détourés) : marron pour fonds clairs, crème pour fonds chocolat
    ('logo', os.path.expanduser('~/roll-n-love/assets/images/src/logo.png'), None, None, (400, 800, 1348), (134, 674, 1482, 1322)),
    ('logo-cream', f'{V2}/logo-footer.png', None, None, (450, 900), None),
    # le O de ROLL : un roll vu de dessus, spirale centrée
    ('roll-o', f'{LIB}/0f6a6295-c3c7-4d19-b434-cadbe3420cc5.JPG', 1, None, (320, 640, 960), (90, 310, 950, 1170)),
    # héro : polaroïds
    ('ube-plateau', f'{LIB}/f520502b-a1ba-4463-823b-1aaa08ae9181.JPG', 4 / 5, (0.5, 0.5), W_STD, None),
    ('latte-glace', f'{LIB}/d80f9a7b-6de0-4777-b4b2-3ceab5dc73a8.JPG', 4 / 5, (0.5, 0.55), W_STD, None),
    ('choco-kinder', f'{LIB}/d3840309-3908-4c1d-8527-ed5d0eb68333.JPG', 4 / 5, (0.5, 0.45), W_STD, None),
    # fabrication
    ('rolls-caramel', f'{LIB}/b3b93fe0-8378-42d5-8ca8-a6ed635358e5.JPG', 4 / 5, (0.5, 0.5), W_STD, None),
    ('roll-macro', f'{LIB}/0f6a6295-c3c7-4d19-b434-cadbe3420cc5.JPG', 3 / 4, (0.5, 0.5), W_STD, None),
    # carte
    ('rolls-mms', f'{LIB}/3589adee-1185-4108-9c50-3af548a49aab.JPG', 4 / 5, (0.5, 0.45), W_STD, None),
    ('cappuccino-mains', f'{LIB}/c7810650-a262-4b1e-9c72-6997acaad74b.JPG', 4 / 5, (0.5, 0.5), W_STD, None),
    ('ube-latte', f'{IG}/670144480_17859381396684224_1126623843554825473_n.jpg', 4 / 5, (0.5, 0.5), W_STD, None),
    ('ube-verre', f'{IG}/669797994_17859381387684224_7567590828431093350_n.jpg', 4 / 5, (0.5, 0.5), W_STD, None),
    ('sandwich-main', f'{V2}/sandwich-main.jpg', 4 / 5, (0.5, 0.5), W_STD, None),
    ('brunch-plateau', f'{V2}/brunch-plateau.jpg', 4 / 5, (0.5, 0.5), W_STD, None),
    ('brunch-box', f'{V2}/brunch-box.jpg', 4 / 5, (0.5, 0.5), W_STD, None),
    ('glaces-boules', f'{LIB}/boules.png', None, None, W_STD, None),
    ('affogato', f'{LIB}/affogato.png', None, None, W_STD, None),
    ('vendee-ardoise', f'{IG}/669552880_17858567292684224_8304088070522704372_n.jpg', 4 / 5, (0.5, 0.45), W_STD, None),
    # formules
    ('plateau-choco', f'{LIB}/f2935731-4121-41d0-a37f-c365a5347419.JPG', 4 / 5, (0.5, 0.6), W_STD, None),
    ('box-rolls', f'{IG}/670458785_17859847245684224_2707259251576503185_n.jpg', 4 / 5, (0.5, 0.6), W_STD, None),
    # la maison
    ('salon', f'{IG}/631647750_17846686170684224_9038066004234508631_n.jpg', 4 / 5, (0.5, 0.55), W_STD, None),
    ('salon-large', f'{IG}/631846667_17846686149684224_7322139238903941653_n.jpg', 3 / 2, (0.5, 0.6), W_STD, None),
    ('coin-miroir', f'{IG}/632411760_17846686140684224_2915244251312964067_n.jpg', 4 / 5, (0.5, 0.5), W_STD, None),
    ('gerantes', f'{IG}/MjAyNjA0ZDE0OWIzZDMwOTNiNmI1NGM0Zjk0Yzg1NGQ1N2ZlNjM.avif', 3 / 2, (0.5, 0.5), W_STD, None),
    ('the-plateau', f'{LIB}/8ba1878e-13b7-48ed-8b58-c1695e14b437.JPG', 4 / 5, (0.5, 0.6), W_STD, None),
    ('rolls-daim', f'{IG}/639468935_17848861188684224_9172572896023649567_n.jpg', 4 / 5, (0.5, 0.6), W_STD, None),
    ('plaque-salon', f'{LIB}/a6fbb717-166a-43ac-8814-7f00038b0b62.JPG', 4 / 5, (0.5, 0.6), W_STD, None),
    ('gobelet-main', f'{V2}/gobelet-main.jpg', 4 / 5, (0.5, 0.5), W_STD, None),
    # vitrine Instagram : derniers posts publics de @roll_in_love (640 px max)
    ('ig-jeux-rolls', f'{SRC}/jeux-rolls.jpg', 4 / 5, (0.5, 0.5), W_SMALL, None),
    ('ig-oreo-kitkat', f'{SRC}/oreo-kitkat.jpg', 4 / 5, (0.5, 0.5), W_SMALL, None),
    ('ig-matcha-fraise', f'{SRC}/matcha-fraise.jpg', 4 / 5, (0.5, 0.5), W_SMALL, None),
    ('ig-ruby-yuzu', f'{SRC}/ruby-yuzu.jpg', 4 / 5, (0.5, 0.5), W_SMALL, None),
    ('ig-mojito-ruby', f'{SRC}/mojito-ruby.jpg', 4 / 5, (0.5, 0.5), W_SMALL, None),
    ('ig-brunch', f'{SRC}/brunch.jpg', 4 / 5, (0.5, 0.5), W_SMALL, None),
    # créations de la carte (affiches de la maison, recadrées sur la boisson)
    ('matcha-snow', os.path.join(CRE, 'matcha-snow.jpg'), None, None, W_STD, (322, 560, 778, 1130)),
    ('creme-brulee-latte', os.path.join(CRE, 'creme-brulee-latte.jpg'), None, None, W_STD, (140, 630, 700, 1330)),
    ('marshmallow-dream', os.path.join(CRE, 'marshmallow-dream.jpg'), None, None, W_STD, (120, 590, 680, 1290)),
    ('choco-kitkat', f'{IG}/632957247_17847440943684224_4603716757140653260_n.jpg', 4 / 5, (0.5, 0.5), W_STD, None),
]


def crop_focal(im, ratio, focal):
    w, h = im.size
    if ratio is None:
        return im
    if w / h > ratio:
        nw, nh = round(h * ratio), h
    else:
        nw, nh = w, round(w / ratio)
    fx, fy = focal
    x0 = min(max(round(fx * w - nw / 2), 0), w - nw)
    y0 = min(max(round(fy * h - nh / 2), 0), h - nh)
    return im.crop((x0, y0, x0 + nw, y0 + nh))


def main():
    os.makedirs(OUT, exist_ok=True)
    report = {}
    for key, src, ratio, focal, widths, box in MANIFEST:
        if not os.path.exists(src):
            print('MANQUANT', key, src, file=sys.stderr)
            continue
        im = ImageOps.exif_transpose(Image.open(src))
        alpha = im.mode in ('RGBA', 'LA') or 'transparency' in im.info
        im = im.convert('RGBA' if alpha else 'RGB')
        im = im.crop(box) if box else crop_focal(im, ratio, focal or (0.5, 0.5))
        made = []
        for w in widths:
            if w > im.width:
                continue
            h = round(im.height * w / im.width)
            r = im.resize((w, h), Image.LANCZOS)
            r.save(os.path.join(OUT, f'{key}-{w}.avif'), quality=52, speed=4)
            r.save(os.path.join(OUT, f'{key}-{w}.webp'), quality=76, method=6)
            made.append(w)
        if not made or (im.width > made[-1] and any(w > im.width for w in widths)):
            # source entre deux paliers : on sert aussi sa largeur native
            w = im.width
            im.save(os.path.join(OUT, f'{key}-{w}.avif'), quality=52, speed=4)
            im.save(os.path.join(OUT, f'{key}-{w}.webp'), quality=76, method=6)
            made.append(w)
        report[key] = {'widths': made, 'ratio': [im.width, im.height], 'alpha': alpha}
        print(f'{key:16} {im.width}x{im.height} -> {made}')
    with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
        json.dump(report, f, indent=1)


if __name__ == '__main__':
    main()
