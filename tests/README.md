Run `python tests/test_public_flow.py` from the repository root.

Run `python tests/test_direct_edit.py` for mouse and touch editing on all seven products, clean exports, pen fonts/colors, eyelet placements and quote details.

Requires Python, Playwright and Pillow. On Windows the test uses installed Microsoft Edge; elsewhere it uses Playwright Chromium. The test starts its own local HTTP server and intercepts WhatsApp requests. It does not send messages. Downloaded images are inspected inside a temporary directory and removed after the run.
