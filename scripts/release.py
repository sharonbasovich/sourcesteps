"""Build and verify a deterministic, allowlisted local-only release archive."""
from pathlib import Path
import hashlib
import http.client
import json
import shutil
import socket
import subprocess
import time
import zipfile

ROOT = Path(__file__).resolve().parent.parent
NAME = 'SourceSteps-0.1.6-rc1'
FILES = [
    'index.html', 'style.css', 'app.js', 'core.js', 'server.js', 'package.json',
    'README.md', 'LICENSE', 'ATTRIBUTION.md', 'DEMO.md', 'RELEASE-NOTES.md',
    'scripts/release.py', 'tests/core.test.js', 'tests/flows.test.js',
    'tests/limits.test.js', 'tests/import-boundaries.test.js', 'tests/split-selector.test.js', 'tests/restart.test.js',
    'tests/document-integrity.test.js',
    'tests/make-fixtures.js', 'tests/BROWSER-CHECKLIST.md',
    'tests/fixtures/valid.json', 'tests/fixtures/invalid.json',
    'evidence/desktop.jpg', 'evidence/mobile-390.jpg',
]

def sha(data):
    return hashlib.sha256(data).hexdigest()

def build(target):
    data = {p: (ROOT / p).read_bytes() for p in FILES}
    data['VERIFICATION.md'] = (ROOT / 'RELEASE-NOTES.md').read_bytes()
    # Canonical UTF-8 manifest does not hash itself; the ZIP hash covers it.
    data['MANIFEST.sha256'] = ''.join(f'{sha(data[p])}  {p}\n' for p in sorted(data)).encode('utf-8')
    with zipfile.ZipFile(target, 'w', compression=zipfile.ZIP_STORED) as archive:
        for p in sorted(data):
            info = zipfile.ZipInfo(NAME + '/' + p, date_time=(2026, 10, 20, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data[p])
    return data

def main():
    # Unique output folder preserves every prior build rather than overwriting it.
    dist = ROOT / 'dist'
    dist.mkdir(exist_ok=True)
    out = dist / ('verification-' + str(time.time_ns()))
    out.mkdir()
    archive_path = out / (NAME + '.zip')
    expected = build(archive_path)
    second = out / 'reproducibility-check.zip'
    build(second)
    assert archive_path.read_bytes() == second.read_bytes(), 'Nonreproducible archive'
    second.unlink()  # Exact disposable file created immediately above.
    extracted = out / 'unpacked'
    extracted.mkdir()
    with zipfile.ZipFile(archive_path) as archive:
        entries = archive.namelist()
        assert len(entries) == len(set(entries)) == len(expected)
        for entry in entries:
            target = (extracted / entry).resolve()
            assert target.is_relative_to(extracted.resolve()), 'Unsafe ZIP member'
            assert entry.startswith(NAME + '/')
        archive.extractall(extracted)
    copy = extracted / NAME
    for p, content in expected.items():
        assert (copy / p).read_bytes() == content, 'Unpacked file mismatch: ' + p
    manifest = (copy / 'MANIFEST.sha256').read_text(encoding='utf-8')
    for line in manifest.splitlines():
        digest, path = line.split('  ', 1)
        assert sha((copy / path).read_bytes()) == digest
    node = shutil.which('node')
    assert node, 'Existing Node.js is required; nothing will be installed'
    tests = sorted(str(p.relative_to(copy)) for p in (copy / 'tests').glob('*.test.js'))
    tested = subprocess.run([node, '--test', *tests], cwd=copy, capture_output=True, text=True, encoding='utf-8')
    (out / 'packaged-tests.tap').write_text(tested.stdout + tested.stderr, encoding='utf-8')
    assert tested.returncode == 0, 'Packaged tests failed; inspect packaged-tests.tap'
    # Refuse to test against or terminate a preexisting server.
    # Bind checks availability without relying on a refused connection; some
    # Windows hosts silently time out probes to an unbound loopback port.
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        probe.bind(('127.0.0.1', 4173))
    server = subprocess.Popen([node, 'server.js'], cwd=copy, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    checks = []
    try:
        assert server.stdout.readline().strip() == b'SourceSteps: http://127.0.0.1:4173', 'Packaged server did not start'
        for url in ['/', '/style.css', '/app.js', '/core.js', '/package.json', '/tests/fixtures/valid.json', '/.env', '/../README.md']:
            conn = http.client.HTTPConnection('127.0.0.1', 4173, timeout=3)
            conn.request('GET', url)
            response = conn.getresponse()
            body = response.read()
            wanted = 200 if url in ['/', '/style.css', '/app.js', '/core.js'] else 404
            assert response.status == wanted, (url, response.status)
            if wanted == 200:
                assert "connect-src 'none'" in response.getheader('Content-Security-Policy', '')
                path = 'index.html' if url == '/' else url[1:]
                assert body == (copy / path).read_bytes()
            checks.append(f'{url}: {response.status}')
            conn.close()
    finally:
        server.terminate()
        server.communicate(timeout=5)
    digest = sha(archive_path.read_bytes())
    (out / (NAME + '.zip.sha256')).write_text(f'{digest}  {NAME}.zip\n', encoding='utf-8')
    (out / 'verification.json').write_text(json.dumps({
        'archive': NAME + '.zip', 'sha256': digest, 'files': len(expected),
        'deterministic_rebuild': True, 'manifest_verified': True,
        'packaged_tests_passed': True, 'loopback_http_checks': checks,
        'network_scope': 'only 127.0.0.1:4173; no external requests',
        'limitations': 'No historical browser export retry, direct-file compatibility, physical-device or screen-reader claim; see VERIFICATION.md for separate Chromium evidence',
    }, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'archive': str(archive_path), 'sha256': digest, 'files': len(expected), 'verified': True}))

if __name__ == '__main__':
    main()
