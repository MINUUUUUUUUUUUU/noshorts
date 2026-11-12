from playwright.sync_api import sync_playwright
from pathlib import Path
import json
repo=Path(__file__).resolve().parents[1]
messages=json.loads((repo/'_locales/en/messages.json').read_text())
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=b.new_page()
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('https://fixture.test/**',lambda r:r.fulfill(body=(repo/r.request.url.split('fixture.test/')[1]).read_bytes(),content_type='text/javascript' if r.request.url.endswith('.js') else 'text/html'))
 page.add_init_script('''globalThis.saved={enabled:true,showVideo:false};globalThis.chrome=undefined;globalThis.chrome={i18n:{getMessage:k=>MESSAGES[k]?.message||'',getUILanguage:()=> 'en'},storage:{sync:{get:(d,cb)=>cb({...d,...saved}),set:(v,cb)=>{Object.assign(saved,v);cb?.()}} ,onChanged:{addListener(){}}}};'''.replace('MESSAGES','('+json.dumps(messages)+')'))
 page.goto('https://fixture.test/src/popup.html')
 assert page.locator('#toggle-enabled').is_checked(), errors
 page.locator('#row-enabled .slider').click()
 assert page.locator('#toggle-show').is_enabled()
 assert page.evaluate('saved.enabled') is False
 page.locator('#row-show .slider').click()
 assert page.evaluate('saved.showVideo') is True
 assert page.evaluate('saved.enabled') is False
 page.locator('#row-enabled .slider').click()
 assert page.locator('#toggle-show').is_checked()
 page.goto('https://fixture.test/src/blocked.html')
 assert page.title()==messages['blockedTitle']['message']
 page.set_content('<html class="ysb-on"><body><grid-shelf-view-model id="normal">normal</grid-shelf-view-model><grid-shelf-view-model id="short"><a href="/shorts/example">short</a></grid-shelf-view-model><yt-shorts-lockup-view-model>short</yt-shorts-lockup-view-model><ytd-rich-item-renderer><a href="https://www.youtube.com/shorts/example">short</a></ytd-rich-item-renderer></body></html>')
 page.add_style_tag(content=(repo/'src/hide.css').read_text())
 assert page.locator('#normal').is_visible()
 for selector in ['#short','yt-shorts-lockup-view-model','ytd-rich-item-renderer']:assert page.locator(selector).is_hidden()
 page.evaluate("document.documentElement.classList.remove('ysb-on')")
 assert page.locator('#short').is_visible()
 assert not errors,errors
 b.close()
print('PASS: browser popup storage callbacks, block-page localization, Shorts CSS and normal shelf visibility (mock Chrome APIs; not an installed extension)')
