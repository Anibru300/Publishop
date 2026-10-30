"""Interaction regression: seven products, text styles, mouse/touch and eyelets."""
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
        with sync_playwright() as p, TemporaryDirectory() as artifacts:
            browser = p.chromium.launch(headless=True, **({'channel': 'msedge'} if os.name == 'nt' else {}))
            context = browser.new_context(viewport={'width': 1360, 'height': 950}, has_touch=True)
            context.route('https://wa.me/**', lambda route: route.fulfill(status=200, body='Test only'))
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            output = io.BytesIO()
            Image.new('RGB', (400, 300), 'red').save(output, format='PNG')
            paths = [f'disena-producto.html?producto={name}' for name in ['pen', 'thermos', 'banner', 'mdf', 'puzzle']]
            paths += ['personaliza-playera.html', 'personaliza-taza.html']
            for index, path in enumerate(paths):
                page.goto(base + path)
                if index >= 5:
                    page.wait_for_function("!document.querySelector('#downloadPreview').disabled")
                page.locator('#designFile').set_input_files({'name': 'sample.png', 'mimeType': 'image/png', 'buffer': output.getvalue()})
                item = page.locator('.direct-item[aria-pressed="true"]:visible')
                item.wait_for()
                item.scroll_into_view_if_needed()
                box = item.bounding_box()
                old_x = float(page.locator('#designX').input_value())
                page.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2)
                page.mouse.down()
                page.mouse.move(box['x'] + box['width'] / 2 + 25, box['y'] + box['height'] / 2 + 6, steps=5)
                page.mouse.up()
                assert float(page.locator('#designX').input_value()) != old_x, path
                handle = item.locator('.handle-se')
                box = handle.bounding_box()
                old_scale = float(page.locator('#designScale').input_value())
                page.mouse.move(box['x'] + 11, box['y'] + 11)
                page.mouse.down()
                page.mouse.move(box['x'] + 33, box['y'] + 33, steps=5)
                page.mouse.up()
                assert float(page.locator('#designScale').input_value()) > old_scale, path
                item.focus()
                old_x = float(page.locator('#designX').input_value())
                page.keyboard.press('ArrowLeft')
                assert float(page.locator('#designX').input_value()) != old_x
                with page.expect_download() as result:
                    page.locator('#downloadPreview').click()
                target = Path(artifacts) / f'preview-{index}.png'
                result.value.save_as(target)
                # Selection handles must not contaminate exported artwork.
                with Image.open(target) as image:
                    pixels = image.convert('RGB').get_flattened_data()
                    assert sum(r == 124 and g == 58 and b == 237 for r, g, b in pixels) < 10
                print('PASS direct move, corner resize, keyboard and clean export:', path)

            page.goto(base + 'disena-producto.html?producto=pen')
            colors = page.locator('#baseColor option').all_inner_texts()
            assert 'Plateado' not in colors
            assert all(name in colors for name in ['Rosa', 'Azul fuerte', 'Blanco'])
            page.locator('#baseColor').select_option('#e788b9')
            page.locator('#customText').fill('Carlos')
            page.locator('#textFont').select_option(index=2)
            page.locator('#textBold').check()
            page.locator('#textItalic').check()
            page.locator('#addText').click()
            assert page.locator('[data-layer]').count() == 1
            page.locator('#customText').fill('Carlos Urbina')
            page.locator('#updateText').click()
            assert page.locator('[data-layer]').count() == 1
            assert 'Carlos Urbina' in page.locator('[data-layer]').inner_text()
            with page.expect_download():
                with page.expect_popup() as target:
                    page.locator('#finishOrder').click()
            popup = target.value
            popup.wait_for_url('https://wa.me/**')
            message = urllib.parse.parse_qs(urllib.parse.urlsplit(popup.url).query)['text'][0]
            assert 'Carlos Urbina' in message and 'negritas' in message and 'cursiva' in message and 'Rosa' in message
            popup.close()
            print('PASS pen colors, cursive/bold font, update existing text and quote')

            page.goto(base + 'disena-producto.html?producto=banner')
            page.locator('#hasEyelets').wait_for()
            pixel = lambda x, y: page.locator('#flatPreview').evaluate(f'(c) => [...c.getContext("2d").getImageData({x},{y},1,1).data].slice(0,3)')
            assert pixel(205, 177) != [255, 255, 255]
            page.locator('#hasEyelets').uncheck()
            assert pixel(205, 177) == [255, 255, 255]
            page.locator('#hasEyelets').check()
            page.locator('#eyeletPosition').select_option('top')
            assert pixel(600, 177) != [255, 255, 255]
            assert pixel(600, 723) == [255, 255, 255]
            page.locator('#eyeletPosition').select_option('perimeter')
            assert pixel(600, 723) != [255, 255, 255]
            page.locator('#customText').fill('Mi negocio')
            page.locator('#addText').click()
            with page.expect_download():
                with page.expect_popup() as target:
                    page.locator('#finishOrder').click()
            popup = target.value
            popup.wait_for_url('https://wa.me/**')
            message = urllib.parse.parse_qs(urllib.parse.urlsplit(popup.url).query)['text'][0]
            assert 'Con ojillos' in message and '50 cm' in message
            popup.close()
            # Actual touch events must move artwork and invalidate an earlier quote.
            item = page.locator('.direct-item[aria-pressed="true"]')
            item.scroll_into_view_if_needed()
            box = item.bounding_box()
            session = context.new_cdp_session(page)
            point = {'x': box['x'] + box['width'] / 2, 'y': box['y'] + box['height'] / 2}
            session.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [point]})
            point['x'] += 30
            session.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [point]})
            session.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
            assert float(page.locator('#designX').input_value()) > 0
            assert page.locator('#completionPanel').is_hidden()
            page.set_viewport_size({'width': 390, 'height': 844})
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            assert not errors, errors
            print('PASS eyelet locations/pixels, quote, touch drag and stale quote invalidation')
            browser.close()
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    run()
