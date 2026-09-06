"""Package prepared store materials after Android packaging; never bundle them into the app."""
from pathlib import Path
import json
import shutil
import zipfile

version = json.loads(Path('package.json').read_text())['version']
folder = Path('release/google-play') / version
shutil.copyfile(f'docs/RELEASE_PREPARATION_{version}.md', folder / 'release-status.md')
archive = Path('release') / f'Dishdasha-Dash-{version}-Google-Play-kit.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for p in sorted(folder.rglob('*')):
        if p.is_file():
            z.write(p, Path('Dishdasha-Dash-Google-Play-kit') / p.relative_to(folder))
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
out = Path('dist/release-kit')
out.mkdir(exist_ok=True)
shutil.copyfile(archive, out / archive.name)
(out / 'index.html').write_text(f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dishdasha Dash — release preparation</title><style>body{{margin:0;background:#101e32;color:#fff1d0;font:18px/1.6 system-ui;padding:32px}}main{{max-width:640px;margin:6vh auto}}h1{{line-height:1.15}}a{{color:inherit}}.download{{display:block;background:#ffc940;color:#172238;text-decoration:none;padding:18px 24px;border-radius:8px;font-weight:700;margin:28px 0}}</style><main><a href="/">← Back to the game</a><h1>Google Play preparation kit</h1><p>Dishdasha Dash · {version}</p><a class="download" href="{archive.name}" download>Download the release kit</a><p>Store descriptions in English and Arabic, icon, feature graphic, gameplay previews, privacy draft, signing instructions and a device-test checklist.</p><p>This is a review kit. Publisher details, a public privacy page, upload signing, installed-device testing and the applicable Google Play account steps remain to be completed.</p><a href="/test-builds/">Get the Android test APK →</a></main></html>''')
print(f'Validated review kit archive: {archive.stat().st_size} bytes')
