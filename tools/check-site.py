#!/usr/bin/env python3
"""
Roll in Love — vérification des pages générées (aucune dépendance, Python 3).

    python3 tools/build.py && python3 tools/check-site.py

Pour chaque page *.html à la racine :
  · <title> présent (30–65 car.), meta description (40–165 car.) sauf noindex
  · canonical absolue en https://rollinlove.com, égale à l'URL propre de la page
  · un seul <h1>, pas de saut de niveau de titre (h2 → h4)
  · images : attribut alt présent, width/height présents
  · aucun id en double
  · liens internes : la page cible existe, l'ancre #… existe sur la page cible
  · JSON-LD : JSON valide, chaque {"@id": …} référencé est défini sur la page
  · aucun gabarit {{…}} oublié
Puis sitemap.xml : chaque URL correspond à une page indexable, et chaque page
indexable est dans le sitemap.
Code de sortie 1 au moindre problème.
"""
import json
import os
import re
import sys
from html.parser import HTMLParser
from xml.etree import ElementTree

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SITE = 'https://rollinlove.com'


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids, self.dup_ids = set(), set()
        self.headings, self.imgs, self.links = [], [], []
        self.title, self.meta, self.canonical = None, {}, None
        self.jsonld, self._in = [], None
        self._buf = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a:
            (self.dup_ids if a['id'] in self.ids else self.ids).add(a['id'])
        if re.fullmatch(r'h[1-6]', tag):
            self.headings.append(int(tag[1]))
        if tag == 'img':
            self.imgs.append(a)
        if tag == 'a' and 'href' in a:
            self.links.append(a['href'])
        if tag == 'meta' and 'name' in a:
            self.meta[a['name']] = a.get('content', '')
        if tag == 'link' and a.get('rel') == 'canonical':
            self.canonical = a.get('href')
        if tag == 'title' or (tag == 'script' and a.get('type') == 'application/ld+json'):
            self._in, self._buf = tag, []

    def handle_data(self, data):
        if self._in:
            self._buf.append(data)

    def handle_endtag(self, tag):
        if self._in == tag:
            text = ''.join(self._buf)
            if tag == 'title':
                self.title = text.strip()
            else:
                self.jsonld.append(text)
            self._in = None


def clean_url(name):
    slug = name[:-5]
    return f'{SITE}/' if slug == 'index' else f'{SITE}/{slug}'


def collect_ids(node, defined, used, top=True):
    if isinstance(node, dict):
        if '@id' in node:
            (defined if len(node) > 1 else used).add(node['@id'])
        for v in node.values():
            collect_ids(v, defined, used, False)
    elif isinstance(node, list):
        for v in node:
            collect_ids(v, defined, used, False)


def main():
    pages, problems = {}, []
    for name in sorted(os.listdir(ROOT)):
        if not name.endswith('.html'):
            continue
        with open(os.path.join(ROOT, name), encoding='utf-8') as f:
            html = f.read()
        p = Page()
        p.feed(html)
        p.html = html
        pages[name] = p

    def err(page, msg):
        problems.append(f'{page}: {msg}')

    for name, p in pages.items():
        noindex = 'noindex' in p.meta.get('robots', '')
        if '{{' in p.html:
            err(name, 'gabarit {{…}} non résolu')
        if not p.title:
            err(name, 'pas de <title>')
        elif not noindex and not 30 <= len(p.title) <= 65:
            err(name, f'title {len(p.title)} car. : « {p.title} »')
        if not noindex:
            d = p.meta.get('description', '')
            if not 40 <= len(d) <= 165:
                err(name, f'meta description {len(d)} car.')
            if p.canonical != clean_url(name):
                err(name, f'canonical {p.canonical!r} ≠ {clean_url(name)}')
        h1 = p.headings.count(1)
        if h1 != 1:
            err(name, f'{h1} <h1>')
        for prev, cur in zip(p.headings, p.headings[1:]):
            if cur > prev + 1:
                err(name, f'saut de titre h{prev} → h{cur}')
                break
        for img in p.imgs:
            if 'alt' not in img:
                err(name, f'img sans alt : {img.get("src")}')
            if not img.get('width') or not img.get('height'):
                err(name, f'img sans dimensions : {img.get("src")}')
        if p.dup_ids:
            err(name, f'id en double : {sorted(p.dup_ids)}')
        for href in p.links:
            if href.startswith(('http:', 'https:', 'mailto:', 'tel:')):
                continue
            path, _, anchor = href.partition('#')
            if path in ('', None):
                target = name
            else:
                path = path.split('?')[0]
                target = 'index.html' if path == '/' else path.lstrip('/') + '.html'
                if path.endswith('.html'):
                    err(name, f'lien en .html : {href}')
            if target not in pages:
                err(name, f'lien cassé : {href}')
            elif anchor and anchor not in pages[target].ids:
                err(name, f'ancre absente : {href}')
        for block in p.jsonld:
            try:
                data = json.loads(block)
            except json.JSONDecodeError as e:
                err(name, f'JSON-LD invalide : {e}')
                continue
            defined, used = set(), set()
            collect_ids(data, defined, used)
            for ref in used - defined:
                err(name, f'JSON-LD : @id référencé mais non défini : {ref}')

    tree = ElementTree.parse(os.path.join(ROOT, 'sitemap.xml'))
    ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    in_map = {loc.text.strip() for loc in tree.findall('.//s:loc', ns)}
    indexable = {clean_url(n) for n, p in pages.items() if 'noindex' not in p.meta.get('robots', '')}
    for url in sorted(in_map - indexable):
        problems.append(f'sitemap.xml : {url} ne correspond à aucune page indexable')
    for url in sorted(indexable - in_map):
        problems.append(f'sitemap.xml : {url} absente')

    for line in problems:
        print('✗', line)
    print(f'{len(pages)} pages, {len(in_map)} URL dans le sitemap — '
          + ('OK' if not problems else f'{len(problems)} problème(s)'))
    sys.exit(1 if problems else 0)


if __name__ == '__main__':
    main()
