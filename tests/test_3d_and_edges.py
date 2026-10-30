"""All products use WebGL; independent edge resize, mug boundaries and thermos variants."""
from http.server import ThreadingHTTPServer
from tempfile import TemporaryDirectory
from pathlib import Path
import io
import os
import threading
import urllib.parse

from PIL import Image
from playwright.sync_api import sync_playwright
from test_public_flow import Handler


def run():
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}/'
    try:
        with sync_playwright() as p, TemporaryDirectory() as temp:
            browser = p.chromium.launch(headless=True, **({'channel': 'msedge'} if os.name == 'nt' else {}))
            context = browser.new_context(viewport={'width': 1360, 'height': 950})
            context.route('https://wa.me/**', lambda route: route.fulfill(status=200, body='Test only'))
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            output = io.BytesIO()
            Image.new('RGB', (400, 300), 'red').save(output, format='PNG')
            paths = [f'disena-producto.html?producto={kind}' for kind in ['pen', 'thermos', 'banner', 'mdf', 'puzzle']]
            paths += ['personaliza-playera.html', 'personaliza-taza.html']
            for path in paths:
                page.goto(base + path)
                page.wait_for_function("!document.querySelector('#downloadPreview').disabled")
                viewport = page.locator('#productViewport' if 'disena-' in path else '#mugViewport')
                canvas = viewport.locator('canvas')
                assert canvas.evaluate('(c) => c.getContext("webgl2") instanceof WebGL2RenderingContext'), path
                before = canvas.evaluate('(c) => c.toDataURL()')
                viewport.scroll_into_view_if_needed()
                box = viewport.bounding_box()
                page.mouse.move(box['x'] + 12, box['y'] + 80)
                page.mouse.down()
                page.mouse.move(box['x'] + 85, box['y'] + 105, steps=5)
                page.mouse.up()
                assert canvas.evaluate('(c) => c.toDataURL()') != before, path
                page.locator('#resetView').click()
                page.locator('#designFile').set_input_files({'name': 'image.png', 'mimeType': 'image/png', 'buffer': output.getvalue()})
                item = page.locator('.direct-item[aria-pressed="true"]:visible')
                item.wait_for()

                def edge(corner, dx, dy):
                    item.scroll_into_view_if_needed()
                    h = item.locator('.handle-' + corner).bounding_box()
                    page.mouse.move(h['x'] + h['width'] / 2, h['y'] + h['height'] / 2)
                    page.mouse.down()
                    page.mouse.move(h['x'] + h['width'] / 2 + dx, h['y'] + h['height'] / 2 + dy, steps=5)
                    page.mouse.up()

                edge('e', -10, 0)
                assert float(page.locator('#designStretchX').input_value()) < 100, path
                assert float(page.locator('#designStretchY').input_value()) == 100, path
                old_x = page.locator('#designStretchX').input_value()
                edge('s', 0, -8)
                assert float(page.locator('#designStretchY').input_value()) < 100, path
                assert page.locator('#designStretchX').input_value() == old_x, path
                print('PASS WebGL rotation and independent width/height handles:', path)

            page.goto(base + 'personaliza-taza.html')
            page.wait_for_function("!document.querySelector('#downloadPreview').disabled")
            page.locator('#customText').fill('TEXTO LARGO DE BORDE A BORDE')
            page.locator('#addText').click()
            page.locator('[data-align="top"]').click()
            assert float(page.locator('#designY').input_value()) < -30
            page.locator('[data-align="bottom"]').click()
            assert float(page.locator('#designY').input_value()) > 30
            page.locator('[data-align="left"]').click()
            assert float(page.locator('#designX').input_value()) < -50
            page.locator('[data-align="center"]').click()
            assert page.locator('#designX').input_value() == '0'
            assert page.locator('#designY').input_value() == '0'
            print('PASS mug artwork reaches top, bottom and wrap edge beyond old limits')

            page.goto(base + 'disena-producto.html?producto=thermos')
            page.wait_for_function("!document.querySelector('#downloadPreview').disabled")
            page.locator('#customText').fill('MI TERMO')
            page.locator('#addText').click()
            images = set()
            for model in ['20', '30', '40', 'short', 'bottle']:
                page.locator('#thermosModel').select_option(model)
                assert page.locator('[data-layer]').count() == 1
                images.add(page.locator('#productViewport canvas').evaluate('(c) => c.toDataURL()'))
                assert page.locator('#thermosReference').is_hidden() == (model == 'short')
                with page.expect_download() as download:
                    page.locator('#downloadPreview').click()
                file = Path(temp) / f'{model}.png'
                download.value.save_as(file)
                with Image.open(file) as image:
                    assert image.size == (1600, 1810)
            assert len(images) == 5
            page.locator('#thermosModel').select_option('40')
            with page.expect_download():
                with page.expect_popup() as result:
                    page.locator('#finishOrder').click()
            popup = result.value
            popup.wait_for_url('https://wa.me/**')
            message = urllib.parse.parse_qs(urllib.parse.urlsplit(popup.url).query)['text'][0]
            assert '40 oz' in message and 'asa' in message
            popup.close()
            page.set_viewport_size({'width': 390, 'height': 844})
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            assert not errors, errors
            print('PASS five distinct thermos geometries, references, four-view exports, retained text, quote and mobile')
            browser.close()
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    run()
