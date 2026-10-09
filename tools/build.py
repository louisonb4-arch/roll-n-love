#!/usr/bin/env python3
"""
Roll in Love — assemblage du site (aucune dépendance, Python 3).

    python3 tools/build.py

1. CSS : concatène les fichiers sources (assets/css/{commons,components,ui,
   modules}/*.css, un fichier par composant, JS ↔ CSS 1:1) dans l'ordre de
   CSS_ORDER, vers assets/css/site.css — une seule feuille, un seul aller-retour.
2. Pages : src/*.html → *.html à la racine. Remplace
      {{pic:clé|texte alternatif|sizes|attributs}}  par un <picture> AVIF + WebP
         (srcset, width/height exacts depuis assets/img/manifest.json)
      {{inc:nom}}  par src/_partials/nom.html (en-tête, pied de page…)
      {{v}}  par l'empreinte du CSS et du JS (les URL changent à chaque
         modification : le cache long de vercel.json ne sert jamais de vieux
         fichiers).
Relancer après toute modification de src/, assets/css/ ou assets/js/.
"""
import hashlib
import json
import os
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
CSS_DIR = os.path.join(ROOT, 'assets', 'css')
JS_DIR = os.path.join(ROOT, 'assets', 'js')
SRC = os.path.join(ROOT, 'src')
IMG = '/assets/img'

CSS_ORDER = [
    'commons/tokens.css',
    'commons/base.css',
    'commons/motion.css',
    'components/polaroid.css',
    'components/annotation.css',
    'components/accordion.css',
    'ui/site-header.css',
    'ui/site-intro.css',
    'ui/site-footer.css',
    'ui/cookie-banner.css',
    'modules/hero.css',
    'modules/geste.css',
    'modules/carte.css',
    'modules/formules.css',
    'modules/maison.css',
    'modules/avis.css',
    'modules/vitrine.css',
    'modules/infos.css',
    'modules/legal.css',
    'modules/notfound.css',
]


def build_css():
    parts = ['/* Fichier GÉNÉRÉ par tools/build.py — modifier les sources (assets/css, sous-dossiers) */\n']
    for rel in CSS_ORDER:
        path = os.path.join(CSS_DIR, rel)
        if not os.path.exists(path):
            print('  (absent)', rel)
            continue
        with open(path, encoding='utf-8') as f:
            parts.append(f'\n/* ===== {rel} ===== */\n' + f.read())
    css = minify(''.join(parts))
    with open(os.path.join(CSS_DIR, 'site.css'), 'w', encoding='utf-8') as f:
        f.write(css)
    return css


def minify(css):
    """Minification prudente : commentaires et espaces superflus seulement.
    Rien n'est touché à l'intérieur des règles qui pourrait changer le sens
    (espaces de calc(), sélecteurs descendants…)."""
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    css = ' '.join(line.strip() for line in css.splitlines() if line.strip())
    for a_, b_ in (('{ ', '{'), (' {', '{'), ('; ', ';'), (' }', '}'), ('} ', '}'), (';}', '}')):
        css = css.replace(a_, b_)
    return '/* Roll in Love — généré par tools/build.py depuis assets/css (sources commentées) */\n' + css + '\n'


def fingerprint(css):
    h = hashlib.sha1(css.encode())
    for dirpath, _, files in sorted(os.walk(JS_DIR)):
        for name in sorted(files):
            if name.endswith('.js'):
                with open(os.path.join(dirpath, name), 'rb') as f:
                    h.update(f.read())
    return h.hexdigest()[:10]


def picture(spec, manifest):
    parts = spec.split('|')
    key, alt = parts[0], parts[1]
    sizes = parts[2] if len(parts) > 2 and parts[2] else '100vw'
    attrs = parts[3] if len(parts) > 3 else ''
    if key not in manifest:
        sys.exit(f'Image inconnue : {key} (relancer tools/build-images.py ?)')
    m = manifest[key]
    widths = m['widths']
    w0, h0 = m['ratio']
    big = widths[-1]
    width, height = big, round(h0 * big / w0)
    default = widths[1] if len(widths) > 1 else widths[0]
    avif = ', '.join(f'{IMG}/{key}-{w}.avif {w}w' for w in widths)
    webp = ', '.join(f'{IMG}/{key}-{w}.webp {w}w' for w in widths)
    if 'loading=' not in attrs:
        attrs += ' loading="lazy"'
    alt_attr = alt.replace('"', '&quot;')
    return (f'<picture><source type="image/avif" srcset="{avif}" sizes="{sizes}">'
            f'<img src="{IMG}/{key}-{default}.webp" srcset="{webp}" sizes="{sizes}" '
            f'width="{width}" height="{height}" alt="{alt_attr}" decoding="async" {attrs.strip()}></picture>')


def partial(name):
    with open(os.path.join(SRC, '_partials', f'{name}.html'), encoding='utf-8') as f:
        return f.read().rstrip('\n')


def build_pages(version):
    with open(os.path.join(ROOT, 'assets', 'img', 'manifest.json')) as f:
        manifest = json.load(f)
    for name in sorted(os.listdir(SRC)):
        if not name.endswith('.html'):
            continue
        with open(os.path.join(SRC, name), encoding='utf-8') as f:
            html = f.read()
        html = re.sub(r'\{\{inc:([\w-]+)\}\}', lambda m: partial(m.group(1)), html)
        html = re.sub(r'\{\{pic:(.*?)\}\}', lambda m: picture(m.group(1), manifest), html, flags=re.S)
        html = html.replace('{{v}}', version)
        left = re.findall(r'\{\{.*?\}\}', html)
        if left:
            sys.exit(f'{name} : gabarits non résolus {left[:3]}')
        header = f'<!-- Page GÉNÉRÉE par tools/build.py depuis src/{name} — ne pas modifier ici. -->\n'
        html = html.replace('<!doctype html>\n', '<!doctype html>\n' + header, 1)
        with open(os.path.join(ROOT, name), 'w', encoding='utf-8') as f:
            f.write(html)
        print('  page', name)


if __name__ == '__main__':
    css = build_css()
    v = fingerprint(css)
    build_pages(v)
    print('version', v, '· site.css', round(len(css.encode()) / 1024, 1), 'Ko')
