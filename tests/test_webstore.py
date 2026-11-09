import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('webstore', Path(__file__).resolve().parents[1] / 'scripts/webstore.py')
webstore = importlib.util.module_from_spec(spec)
spec.loader.exec_module(webstore)


def revision(version, state='PUBLISHED'):
    return {'state': state, 'distributionChannels': [{'crxVersion': version}]}


class WebStoreTests(unittest.TestCase):
    def test_package_has_unique_version_and_only_extension_files(self):
        original = (webstore.ROOT / 'manifest.json').read_bytes()
        with tempfile.TemporaryDirectory() as directory:
            archive = Path(directory) / 'extension.zip'
            version = webstore.package(12, archive)
            with zipfile.ZipFile(archive) as z:
                self.assertEqual(json.loads(z.read('manifest.json'))['version'], version)
                self.assertEqual(version, json.loads(original)['version'] + '.12')
                self.assertTrue(all(n.split('/')[0] in ('manifest.json', 'src', 'icons', '_locales') for n in z.namelist()))
                self.assertIn('src/content.js', z.namelist())
        self.assertEqual((webstore.ROOT / 'manifest.json').read_bytes(), original)

    def test_version_limit(self):
        for run in (0, 65536):
            with self.assertRaises(ValueError):
                webstore.package(run, '/unused')

    def test_retries_skip_published_and_pending_versions(self):
        self.assertEqual(webstore.submission_action({'publishedItemRevisionStatus': revision('1.4.0.12')}, '1.4.0.12'), 'already published')
        self.assertEqual(webstore.submission_action({'submittedItemRevisionStatus': revision('1.4.0.12', 'PENDING_REVIEW')}, '1.4.0.12'), 'already submitted')

    def test_other_pending_version_and_downgrades_are_blocked(self):
        for status in ({'submittedItemRevisionStatus': revision('1.4.0.11', 'PENDING_REVIEW')}, {'publishedItemRevisionStatus': revision('1.5.0')}):
            with self.assertRaises(RuntimeError):
                webstore.submission_action(status, '1.4.0.12')

    def test_upload_poll_then_submit_and_failure_never_publishes(self):
        env = dict.fromkeys(('CWS_PUBLISHER_ID', 'CWS_EXTENSION_ID', 'CWS_CLIENT_ID', 'CWS_CLIENT_SECRET', 'CWS_REFRESH_TOKEN'), 'test')
        for final_state in ('SUCCEEDED', 'FAILED'):
            with self.subTest(final_state=final_state), tempfile.TemporaryDirectory() as directory:
                archive = Path(directory) / 'extension.zip'
                webstore.package(12, archive)
                calls = []
                responses = iter([{'access_token': 'fake'}, {}, {'uploadState': 'IN_PROGRESS'}, {'lastAsyncUploadState': final_state}, {'state': 'PENDING_REVIEW'}])
                def call(url, **kwargs):
                    calls.append((url, kwargs))
                    return next(responses)
                if final_state == 'SUCCEEDED':
                    self.assertEqual(webstore.publish(archive, env=env, call=call, sleep=lambda _: None), 'PENDING_REVIEW')
                    self.assertTrue(calls[-1][0].endswith(':publish'))
                    self.assertEqual(json.loads(calls[-1][1]['data']), {'publishType': 'DEFAULT_PUBLISH', 'skipReview': False})
                else:
                    with self.assertRaises(RuntimeError):
                        webstore.publish(archive, env=env, call=call, sleep=lambda _: None)
                    self.assertFalse(any(url.endswith(':publish') for url, _ in calls))

    def test_missing_secrets_fail_before_network(self):
        with self.assertRaisesRegex(ValueError, 'Missing configuration'):
            webstore.publish('unused.zip', env={}, call=lambda *a, **k: self.fail('network used'))


if __name__ == '__main__':
    unittest.main()
