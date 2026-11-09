"""Build and submit the extension using Chrome Web Store API v2 (stdlib only)."""
import argparse
import json
import os
from pathlib import Path
import re
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
API = 'https://chromewebstore.googleapis.com/'


def package(revision, output):
    manifest = json.loads((ROOT / 'manifest.json').read_text())
    base = manifest['version'].split('.')
    if len(base) != 3 or not 1 <= revision <= 65535:
        raise ValueError('Use a three-part manifest version and revision 1..65535; see store/automation.md.')
    manifest['version'] = '.'.join(base + [str(revision)])
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
        archive.writestr('manifest.json', json.dumps(manifest, ensure_ascii=False, indent=2))
        for directory in ('src', 'icons', '_locales'):
            for path in sorted((ROOT / directory).rglob('*')):
                if path.is_file():
                    archive.write(path, path.relative_to(ROOT))
    return manifest['version']


def request(url, *, token=None, data=None, content_type='application/json'):
    headers = {'Content-Type': content_type}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    try:
        with urllib.request.urlopen(urllib.request.Request(url, data=data, headers=headers), timeout=60) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        # Do not log response bodies or request headers, which can contain credentials.
        raise RuntimeError(f'API HTTP {error.code}; check account permissions and the developer dashboard.') from None


def versions(revision):
    return [channel['crxVersion'] for channel in revision.get('distributionChannels', [])]


def version_tuple(value):
    parts = value.split('.')
    if not 1 <= len(parts) <= 4 or any(not re.fullmatch(r'0|[1-9][0-9]*', p) or int(p) > 65535 for p in parts):
        raise ValueError('Invalid Chrome extension version')
    return tuple(map(int, parts)) + (0,) * (4 - len(parts))


def submission_action(status, version):
    if status.get('takenDown'):
        raise RuntimeError('Item taken down; resolve this in the developer dashboard.')
    published = status.get('publishedItemRevisionStatus', {})
    submitted = status.get('submittedItemRevisionStatus', {})
    if version in versions(published):
        return 'already published'
    if submitted.get('state') in ('PENDING_REVIEW', 'STAGED'):
        if version in versions(submitted):
            return 'already submitted'
        return 'WAITING_FOR_REVIEW: another version is pending; the scheduled run will check the latest main again.'
    if any(version_tuple(v) >= version_tuple(version) for v in versions(published)):
        raise RuntimeError('Package version must exceed the published version. Increase manifest.json base version.')
    if submitted.get('state') == 'REJECTED' and version in versions(submitted):
        raise RuntimeError('This version was rejected. Resolve the feedback and start a new workflow run.')
    return 'upload'


def publish(archive, env=os.environ, call=request, sleep=time.sleep):
    required = ('CWS_PUBLISHER_ID', 'CWS_EXTENSION_ID', 'CWS_CLIENT_ID', 'CWS_CLIENT_SECRET', 'CWS_REFRESH_TOKEN')
    missing = [name for name in required if not env.get(name)]
    if missing:
        raise ValueError('Missing configuration: ' + ', '.join(missing))
    with zipfile.ZipFile(archive) as zipped:
        version = json.loads(zipped.read('manifest.json'))['version']
    version_tuple(version)
    token = call('https://oauth2.googleapis.com/token', data=urllib.parse.urlencode({
        'client_id': env['CWS_CLIENT_ID'], 'client_secret': env['CWS_CLIENT_SECRET'],
        'refresh_token': env['CWS_REFRESH_TOKEN'], 'grant_type': 'refresh_token',
    }).encode(), content_type='application/x-www-form-urlencoded')['access_token']
    name = 'publishers/{}/items/{}'.format(*(urllib.parse.quote(env[k], safe='') for k in required[:2]))
    endpoint = API + 'v2/' + name
    status = call(endpoint + ':fetchStatus', token=token)
    action = submission_action(status, version)
    if action != 'upload':
        return action
    uploaded = call(API + 'upload/v2/' + name + ':upload?uploadType=media', token=token,
                    data=Path(archive).read_bytes(), content_type='application/zip')
    state = uploaded.get('uploadState')
    for _ in range(30):
        if state != 'IN_PROGRESS':
            break
        sleep(10)
        state = call(endpoint + ':fetchStatus', token=token).get('lastAsyncUploadState')
    if state != 'SUCCEEDED':
        raise RuntimeError('Upload failed or timed out; check the developer dashboard before retrying.')
    if uploaded.get('crxVersion', version) != version:
        raise RuntimeError('Uploaded version mismatch; refusing submission.')
    result = call(endpoint + ':publish', token=token, data=json.dumps({
        'publishType': 'DEFAULT_PUBLISH', 'skipReview': False,
    }).encode())
    if result.get('state') not in ('PENDING_REVIEW', 'PUBLISHED', 'PUBLISHED_TO_TESTERS'):
        raise RuntimeError('Unexpected submission state; check the developer dashboard.')
    return result['state']


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['package', 'publish'])
    parser.add_argument('--archive', default='noshorts-webstore.zip')
    parser.add_argument('--revision', '--run-number', dest='revision', type=int)
    args = parser.parse_args()
    try:
        if args.action == 'package':
            print(package(args.revision or 0, args.archive))
        else:
            print(publish(args.archive))
    except (ValueError, RuntimeError, OSError, KeyError) as error:
        parser.exit(1, str(error) + '\n')
