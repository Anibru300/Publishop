"""Browser regression check. Run from the repository with Python, Playwright,
Pillow and Edge (Windows), or Playwright Chromium on other systems.
WhatsApp requests are intercepted; this test does not send messages.
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
import io
import os
import threading
import urllib.parse

from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *args):
        pass

    def handle(self):
        try:
            super().handle()
        except ConnectionResetError:
            pass


def run():
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}/'
    try:
        with sync_playwright() as p, TemporaryDirectory() as artifacts:
            browser = p.chromium.launch(headless=True, **({'channel': 'msedge'} if os.name == 'nt' else {}))
            context = browser.new_context(viewport={'width': 1360, 'height': 950})
            context.route('https://wa.me/**', lambda route: route.fulfill(status=200, body='Test only'))
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.add_init_script("Object.defineProperty(navigator,'canShare',{value:()=>true});Object.defineProperty(navigator,'share',{value:async data=>{window.sharedData={text:data.text,count:data.files.length,size:data.files[0].size};}});")

            def goto(path):
                page.goto(base + path)

            def upload():
                output = io.BytesIO()
                image = Image.new('RGBA', (400, 300), 'white')
                ImageDraw.Draw(image).rectangle((60, 60, 340, 240), fill='red')
                image.save(output, format='PNG')
                page.locator('#designFile').set_input_files({'name': 'logo.png', 'mimeType': 'image/png', 'buffer': output.getvalue()})
                page.wait_for_function("document.querySelectorAll('[data-layer]').length===1")

            goto('catalogo.html')
            assert page.locator('.mug-catalog-cta').count() == 0
            for category in ['lonas', 'playeras', 'dtf', 'vinil', 'plumas', 'tazas', 'termos', 'mdf', 'rompecabezas']:
                page.locator(f'[data-filter="{category}"]').click()
                page.wait_for_timeout(350)
                page.locator('.product-item:not(.hidden)').first.click()
                assert page.locator('#productDialog').is_visible()
                assert page.locator('#detailSpecs dd').count() == 4
                page.keyboard.press('Escape')
                assert not page.locator('#productDialog').is_visible()
            page.locator('.product-item:not(.hidden)').first.focus()
            page.keyboard.press('Enter')
            assert page.locator('#productDialog').is_visible()
            page.locator('#closeProduct').click()
            page.locator('.personalize-float').click()
            page.wait_for_url('**/personaliza.html')
            assert page.locator('.designer-card').count() == 7
            print('PASS catalog photos, specifications, categories, keyboard and designer entry')

            paths = [f'disena-producto.html?producto={kind}' for kind in ['pen', 'thermos', 'banner', 'mdf', 'puzzle']]
            paths += ['personaliza-playera.html', 'personaliza-taza.html']
            for index, path in enumerate(paths):
                goto(path)
                page.wait_for_selector('#finishOrder')
                if index >= 5:
                    page.wait_for_function("!document.querySelector('#downloadPreview').disabled")
                page.locator('#finishOrder').click()
                assert page.locator('#completionPanel').is_visible()
                assert page.locator('#completionActions').is_hidden()
                upload()
                page.locator('#customText').fill('PUBLI SHOP')
                page.locator('#addText').click()
                assert page.locator('[data-layer]').count() == 2
                page.locator('#designScale').fill('65')
                page.locator('#designScale').dispatch_event('input')
                if 'mdf' in path:
                    page.locator('#boardShape').select_option('heart')
                    page.locator('#mdfMode').select_option('engrave')
                if 'thermos' in path:
                    page.locator('[data-face="back"]').click()
                    page.locator('#customText').fill('MI TERMO')
                    page.locator('#addText').click()
                if 'playera' in path:
                    page.locator('#shirtTechnique').select_option('reflective')
                page.locator('#orderQuantity').fill('12')
                page.locator('#orderNotes').fill('Cotizar mi propuesta')
                with page.expect_download() as download:
                    with page.expect_popup() as popup:
                        page.locator('#finishOrder').click()
                target = popup.value
                target.wait_for_url('https://wa.me/**')
                message = urllib.parse.parse_qs(urllib.parse.urlsplit(target.url).query)['text'][0]
                assert 'Cantidad: 12' in message and 'Cotizar mi propuesta' in message
                if 'playera' in path:
                    assert 'DTF reflejante' in message
                target.close()
                artifact = Path(artifacts) / f'preview-{index}.png'
                download.value.save_as(artifact)
                with Image.open(artifact) as preview:
                    assert preview.width >= 1400
                    if 'playera' in path:
                        assert preview.size == (1600, 990)
                    if 'taza' in path:
                        assert preview.size == (1600, 1790)
                page.locator('#shareOrder').click()
                assert page.evaluate('sharedData.count') == 1
                assert page.evaluate('sharedData.size') > 1000
                page.locator('#orderQuantity').fill('13')
                assert page.locator('#completionPanel').is_hidden()
                print('PASS image/text editor, quote, PNG, share and invalidation:', path)

            page.set_viewport_size({'width': 390, 'height': 844})
            for path in ['catalogo.html', 'personaliza.html', 'disena-producto.html?producto=banner', 'personaliza-playera.html']:
                goto(path)
                page.wait_for_timeout(300)
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), path
            assert not errors, errors
            print('PASS mobile widths and no JavaScript errors')
            browser.close()
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    run()
