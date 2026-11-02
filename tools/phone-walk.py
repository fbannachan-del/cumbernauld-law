"""Viewport-only phone screenshots down the page, stitched side by side for review."""
import os, sys, subprocess, time
from playwright.sync_api import sync_playwright
from PIL import Image
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SITE=os.path.join(ROOT,'site'); OUT=os.path.join(ROOT,'review'); os.makedirs(OUT,exist_ok=True)
srv=subprocess.Popen([sys.executable,'-m','http.server','8768','--bind','127.0.0.1'],cwd=SITE,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(.8)
proxy=os.environ.get('HTTPS_PROXY')
W,H=390,844
try:
    with sync_playwright() as p:
        b=p.chromium.launch(proxy={'server':proxy,'bypass':'127.0.0.1,localhost'} if proxy else None)
        ctx=b.new_context(viewport={'width':W,'height':H},device_scale_factor=2,is_mobile=True,has_touch=True)
        pg=ctx.new_page(); pg.goto('http://127.0.0.1:8768/',wait_until='networkidle'); pg.wait_for_timeout(800)
        total=pg.evaluate('document.documentElement.scrollHeight')
        shots=[]; y=0; i=0
        while y<total and i<16:
            pg.evaluate(f'window.scrollTo(0,{y})'); pg.wait_for_timeout(500)
            f=os.path.join(OUT,f'walk-{i:02d}.png'); pg.screenshot(path=f); shots.append(f); y+=H-60; i+=1
        b.close()
    ims=[Image.open(s) for s in shots]
    cols=4; rows=(len(ims)+cols-1)//cols
    w,h=ims[0].size; sheet=Image.new('RGB',(cols*(w//2)+ (cols-1)*12, rows*(h//2)+(rows-1)*12),(240,240,240))
    for k,im in enumerate(ims):
        im=im.resize((w//2,h//2)); sheet.paste(im,((k%cols)*(w//2+12),(k//cols)*(h//2+12)))
    sheet.save(os.path.join(OUT,'phone-sheet.png')); print('sheet', sheet.size, len(ims),'shots, page height',total)
finally: srv.terminate()
