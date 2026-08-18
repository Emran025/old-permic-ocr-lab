from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path('/home/ubuntu')
ASSET_DIR = ROOT / 'webdev-static-assets' / 'old-permic-gallery'
BUNDLE = ROOT / 'old_permic_bundle'
TRINITY_SOURCE = BUNDLE / '01_primary_images_public_domain' / 'Zyryanskaya_Trinity_Old_Permic_inscription.png'
SAVVAITOV_SOURCE = BUNDLE / '02_historical_scans_public_domain' / 'Savvaitov_1873_calendars_and_Old_Permic_alphabet.pdf'
LYTKIN_SOURCE = BUNDLE / '02_historical_scans_public_domain' / 'Lytkin_1889_Zyryansky_krai.pdf'


def export_trinity_preview() -> Path:
    destination = ASSET_DIR / 'zyryanskaya-trinity-inscription-preview.jpg'
    with Image.open(TRINITY_SOURCE) as image:
        image = image.convert('RGB')
        image.thumbnail((2600, 900), Image.Resampling.LANCZOS)
        image.save(destination, 'JPEG', quality=88, optimize=True, progressive=True)
    return destination


def render_pdf_pages(source: Path, prefix: str, start: int, end: int) -> list[Path]:
    output_prefix = ASSET_DIR / prefix
    subprocess.run(
        [
            'pdftoppm', '-jpeg', '-jpegopt', 'quality=86,progressive=y', '-r', '150',
            '-f', str(start), '-l', str(end), str(source), str(output_prefix),
        ],
        check=True,
    )
    pages = sorted(ASSET_DIR.glob(f'{prefix}-*.jpg'))
    expected_count = end - start + 1
    if len(pages) != expected_count:
        raise RuntimeError(f'Expected {expected_count} rendered pages for {prefix}, found {len(pages)}.')
    return pages


def main() -> None:
    if ASSET_DIR.exists():
        shutil.rmtree(ASSET_DIR)
    ASSET_DIR.mkdir(parents=True)

    files = [export_trinity_preview()]
    files.extend(render_pdf_pages(SAVVAITOV_SOURCE, 'savvaitov-1873', 1, 5))
    files.extend(render_pdf_pages(LYTKIN_SOURCE, 'lytkin-1889', 36, 39))

    manifest = {
        'assets': [file.name for file in files],
        'sources': {
            'zyryanskaya-trinity-inscription-preview.jpg': {
                'title': 'شريط نقش الثالوث الزيرياني',
                'source_url': 'https://commons.wikimedia.org/wiki/File:Zyryanskaya_trinity_text.jpg',
                'rights': 'ملكية عامة/لا قيود معروفة وفق صفحة الملف في ويكيميديا كومنز.',
            },
            'savvaitov-1873': {
                'title': 'ساففايتوف، عن التقاويم الخشبية الزيريانية والأبجدية البرمية، 1873',
                'source_url': 'https://www.booksite.ru/fulltext/zyrya/index.htm',
                'rights': 'العمل التاريخي في الملكية العامة بحكم العمر؛ النسخة الرقمية من مكتبة فولوغدا.',
            },
            'lytkin-1889': {
                'title': 'ليتكين، الإقليم الزيرياني واللغة الزيريانية، 1889',
                'source_url': 'https://archive.org/details/zyrianska1889',
                'rights': 'العمل التاريخي في الملكية العامة بحكم العمر؛ المسح متاح من Internet Archive.',
            },
        },
    }
    (ASSET_DIR / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    for file in files:
        print(f'{file.name}\t{file.stat().st_size}')


if __name__ == '__main__':
    main()
