(function(){
  const state = {
    type:'url',
    dotsType:'rounded',
    cornerType:'extra-rounded',
    colorA:'#22c55e',
    colorB:'#12b3a8',
    bgColor:'#ffffff',
    logoData:null,
    logoSize:0.22,
    gradientShape:'linear',
    gradientAngle:45,
    transparentBg:false
  };

  let qrCode = null;
  let renderToken = 0;
  const wrap = document.getElementById('qr-canvas-wrap');

  function buildData(){
    switch(state.type){
      case 'url':
        return document.getElementById('inUrl').value.trim() || 'https://lakshan.vercel.app';
      case 'text':
        return document.getElementById('inText').value.trim() || 'Hello!';
      case 'wifi': {
        const ssid = document.getElementById('wifiSsid').value.trim();
        const pass = document.getElementById('wifiPass').value.trim();
        const sec = document.getElementById('wifiSec').value;
        return `WIFI:T:${sec};S:${ssid};P:${sec==='nopass'?'':pass};;`;
      }
      case 'vcard': {
        const name = document.getElementById('vName').value.trim();
        const phone = document.getElementById('vPhone').value.trim();
        const email = document.getElementById('vEmail').value.trim();
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEMAIL:${email}\nEND:VCARD`;
      }
    }
  }

  function render(animate){
    const myToken = ++renderToken;
    const data = buildData();
    const size = 1000; // high-resolution master render — print quality, scales down crisply on screen

    const gradientType = state.gradientShape || 'linear';
    const angleRad = (state.gradientAngle||45) * Math.PI / 180;

    const options = {
      width:size,
      height:size,
      type:'svg',
      data:data || ' ',
      margin: Math.round(size*0.022),
      qrOptions:{ errorCorrectionLevel: state.logoData ? 'H' : 'Q' },
      dotsOptions:{
        type: state.dotsType,
        gradient:{
          type: gradientType,
          rotation: angleRad,
          colorStops:[{offset:0, color:state.colorA},{offset:1, color:state.colorB}]
        }
      },
      backgroundOptions:{ color: state.transparentBg ? 'transparent' : state.bgColor },
      cornersSquareOptions:{ type: state.cornerType, color: state.colorA },
      cornersDotOptions:{ type: state.cornerType === 'square' ? 'square' : 'dot', color: state.colorB },
    };

    if(state.logoData){
      options.image = state.logoData;
      options.imageOptions = { crossOrigin:'anonymous', margin:6, imageSize: state.logoSize, hideBackgroundDots:true };
    }

    // Build off-screen first. If a newer render request comes in before this
    // finishes (e.g. a logo image is still loading), we simply drop this one
    // instead of letting it clobber the preview with stale content.
    const built = new QRCodeStyling(options);
    const staging = document.createElement('div');
    built.append(staging);

    const commit = () => {
      if(myToken !== renderToken) return; // superseded by a newer render
      qrCode = built;
      wrap.innerHTML = '';
      while(staging.firstChild) wrap.appendChild(staging.firstChild);

      if(animate){
        const line = document.getElementById('scanLine');
        line.classList.remove('animate');
        void line.offsetWidth;
        line.classList.add('animate');
      }
    };

    // Give any async image-loading a tick to settle, then commit if still current.
    requestAnimationFrame(()=> requestAnimationFrame(commit));
  }

  // Debounced re-render on input
  let t;
  function scheduleRender(animate){
    clearTimeout(t);
    t = setTimeout(()=>render(animate), 180);
  }

  // Type tabs
  document.getElementById('typeTabs').addEventListener('click', (e)=>{
    const tab = e.target.closest('.type-tab');
    if(!tab) return;
    document.querySelectorAll('.type-tab').forEach(el=>el.classList.remove('active'));
    tab.classList.add('active');
    state.type = tab.dataset.type;
    ['Url','Text','Wifi','Vcard'].forEach(k=>{
      document.getElementById('fields'+k).style.display = (k.toLowerCase()===state.type) ? 'block' : 'none';
    });
    scheduleRender(true);
  });

  // Text inputs
  ['inUrl','inText','wifiSsid','wifiPass','vName','vPhone','vEmail'].forEach(id=>{
    const el = document.getElementById(id);
    el.addEventListener('input', ()=>scheduleRender(false));
  });
  document.getElementById('wifiSec').addEventListener('change', ()=>scheduleRender(false));

  // Colors
  document.getElementById('colorA').addEventListener('input', (e)=>{ state.colorA=e.target.value; document.querySelectorAll('.preset').forEach(p=>p.classList.remove('selected')); scheduleRender(false); });
  document.getElementById('colorB').addEventListener('input', (e)=>{ state.colorB=e.target.value; document.querySelectorAll('.preset').forEach(p=>p.classList.remove('selected')); scheduleRender(false); });
  document.getElementById('colorBg').addEventListener('input', (e)=>{
    state.bgColor=e.target.value;
    document.getElementById('bgLabel').textContent = e.target.value;
    scheduleRender(false);
  });

  document.getElementById('presets').addEventListener('click',(e)=>{
    const p = e.target.closest('.preset');
    if(!p) return;
    document.querySelectorAll('.preset').forEach(el=>el.classList.remove('selected'));
    p.classList.add('selected');
    state.colorA = p.dataset.a;
    state.colorB = p.dataset.b;
    document.getElementById('colorA').value = p.dataset.a;
    document.getElementById('colorB').value = p.dataset.b;
    scheduleRender(true);
  });

  // Dot style
  document.querySelectorAll('.style-opt').forEach(opt=>{
    opt.addEventListener('click', ()=>{
      document.querySelectorAll('.style-opt').forEach(o=>o.classList.remove('active'));
      opt.classList.add('active');
      state.dotsType = opt.dataset.dots;
      scheduleRender(true);
    });
  });

  document.getElementById('cornerStyle').addEventListener('change', (e)=>{
    state.cornerType = e.target.value;
    scheduleRender(true);
  });

  // Gradient shape (linear/radial)
  document.getElementById('gradShapeTabs').addEventListener('click', (e)=>{
    const tab = e.target.closest('.type-tab');
    if(!tab) return;
    document.querySelectorAll('#gradShapeTabs .type-tab').forEach(el=>el.classList.remove('active'));
    tab.classList.add('active');
    state.gradientShape = tab.dataset.shape;
    document.getElementById('angleField').style.display = (state.gradientShape==='radial') ? 'none' : 'block';
    scheduleRender(true);
  });

  // Gradient angle
  document.getElementById('gradAngle').addEventListener('input', (e)=>{
    state.gradientAngle = parseInt(e.target.value,10);
    document.getElementById('gradAngleVal').textContent = state.gradientAngle+'°';
    scheduleRender(false);
  });

  // Transparent background toggle
  document.getElementById('transparentToggle').addEventListener('click', (e)=>{
    state.transparentBg = !state.transparentBg;
    e.target.classList.toggle('active', state.transparentBg);
    document.getElementById('bgSwatchWrap').style.opacity = state.transparentBg ? 0.4 : 1;
    document.getElementById('colorBg').disabled = state.transparentBg;
    scheduleRender(true);
  });

  // Caption badge
  document.getElementById('badgeTabs').addEventListener('click', (e)=>{
    const tab = e.target.closest('.type-tab');
    if(!tab) return;
    document.querySelectorAll('#badgeTabs .type-tab').forEach(el=>el.classList.remove('active'));
    tab.classList.add('active');
    const badge = document.getElementById('captionBadge');
    const customField = document.getElementById('badgeCustomField');
    const val = tab.dataset.badge;

    if(val === '__custom__'){
      customField.style.display = 'block';
      const txt = document.getElementById('badgeText').value.trim();
      badge.textContent = txt || 'YOUR TEXT HERE';
      badge.style.display = 'inline-block';
    } else if(val){
      customField.style.display = 'none';
      badge.textContent = val;
      badge.style.display = 'inline-block';
    } else {
      customField.style.display = 'none';
      badge.style.display = 'none';
    }
    applyBadgeColor();
  });

  document.getElementById('badgeText').addEventListener('input', (e)=>{
    const badge = document.getElementById('captionBadge');
    badge.textContent = e.target.value.trim() || 'YOUR TEXT HERE';
  });

  function applyBadgeColor(){
    const color = document.getElementById('badgeColor').value;
    const badge = document.getElementById('captionBadge');
    badge.style.background = `linear-gradient(135deg, ${color}, ${color}cc)`;
  }
  document.getElementById('badgeColor').addEventListener('input', applyBadgeColor);

  document.getElementById('badgeDescription').addEventListener('input', (e)=>{
    const desc = document.getElementById('captionDescription');
    const txt = e.target.value.trim();
    desc.textContent = txt;
    desc.style.display = txt ? 'block' : 'none';
  });

  // Export quality
  let exportSize = 1000;
  document.getElementById('exportQuality').addEventListener('change', (e)=>{
    exportSize = parseInt(e.target.value,10);
  });

  // Logo upload
  const logoInput = document.getElementById('logoInput');
  logoInput.addEventListener('change', (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev)=>{
      state.logoData = ev.target.result;
      document.getElementById('logoImg').src = state.logoData;
      document.getElementById('logoPreview').style.display = 'flex';
      document.getElementById('uploadZone').style.display = 'none';
      scheduleRender(true);
    };
    reader.readAsDataURL(file);
  });
  document.getElementById('removeLogo').addEventListener('click', ()=>{
    state.logoData = null;
    logoInput.value = '';
    document.getElementById('logoPreview').style.display = 'none';
    document.getElementById('uploadZone').style.display = 'block';
    scheduleRender(true);
  });
  document.getElementById('logoSize').addEventListener('input', (e)=>{
    state.logoSize = parseFloat(e.target.value);
    document.getElementById('logoSizeVal').textContent = Math.round(state.logoSize*100)+'%';
    scheduleRender(false);
  });

  // ---- Badge/description helpers, shared by all export formats ----
  function getBadgeInfo(){
    const activeTab = document.querySelector('#badgeTabs .type-tab.active');
    const val = activeTab ? activeTab.dataset.badge : '';
    let text = '';
    if(val === '__custom__'){
      text = document.getElementById('badgeText').value.trim();
    } else if(val){
      text = val;
    }
    const color = document.getElementById('badgeColor').value;
    const description = document.getElementById('badgeDescription').value.trim();
    return { text, color, description };
  }

  function escapeXml(str){
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // Measures text width using canvas so badge pills/SVG text are sized correctly
  const measureCtx = document.createElement('canvas').getContext('2d');
  function measureTextWidth(text, fontPx, weight, family){
    measureCtx.font = `${weight} ${fontPx}px ${family}`;
    return measureCtx.measureText(text).width;
  }

  // Build a fresh high-resolution instance at the chosen export size for downloads,
  // so the on-screen preview stays light while the file you save is print-quality.
  function buildExportQR(){
    const data = buildData();
    const gradientType = state.gradientShape || 'linear';
    const angleRad = (state.gradientAngle||45) * Math.PI / 180;
    const options = {
      width: exportSize,
      height: exportSize,
      type:'svg',
      data:data || ' ',
      margin: Math.round(exportSize*0.022),
      qrOptions:{ errorCorrectionLevel: state.logoData ? 'H' : 'Q' },
      dotsOptions:{
        type: state.dotsType,
        gradient:{ type:gradientType, rotation:angleRad, colorStops:[{offset:0,color:state.colorA},{offset:1,color:state.colorB}] }
      },
      backgroundOptions:{ color: state.transparentBg ? 'transparent' : state.bgColor },
      cornersSquareOptions:{ type: state.cornerType, color: state.colorA },
      cornersDotOptions:{ type: state.cornerType === 'square' ? 'square' : 'dot', color: state.colorB },
    };
    if(state.logoData){
      options.image = state.logoData;
      options.imageOptions = { crossOrigin:'anonymous', margin:6, imageSize: state.logoSize, hideBackgroundDots:true };
    }
    return new QRCodeStyling(options);
  }

  function triggerDownload(dataUrl, filename){
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Composites the QR + badge pill + description into one raster image (PNG/JPG)
  async function exportRaster(extension){
    const qr = buildExportQR();
    const blob = await qr.getRawData('png');
    const url = URL.createObjectURL(blob);
    const img = await new Promise((resolve, reject)=>{
      const im = new Image();
      im.onload = ()=>resolve(im);
      im.onerror = reject;
      im.src = url;
    });

    const { text: badgeText, color: badgeColor, description } = getBadgeInfo();
    const pad = Math.round(exportSize * 0.03);
    const badgeFontPx = Math.round(exportSize * 0.045);
    const descFontPx = Math.round(exportSize * 0.03);
    const badgePadX = Math.round(badgeFontPx * 1.1);
    const badgePadY = Math.round(badgeFontPx * 0.55);
    const gap = Math.round(exportSize * 0.035);

    let extraH = 0;
    let badgeW = 0, badgeH = 0;
    if(badgeText){
      badgeW = measureTextWidth(badgeText, badgeFontPx, 700, "Arial, sans-serif") + badgePadX*2;
      badgeH = badgeFontPx + badgePadY*2;
      extraH += gap + badgeH;
    }
    let descH = 0;
    if(description){
      descH = Math.round(descFontPx * 1.4);
      extraH += gap + descH;
    }

    const canvas = document.createElement('canvas');
    canvas.width = exportSize;
    canvas.height = exportSize + extraH;
    const ctx = canvas.getContext('2d');

    // Background: JPG has no transparency, always needs a fill
    if(extension === 'jpeg' || !state.transparentBg){
      ctx.fillStyle = state.transparentBg ? '#ffffff' : state.bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0, exportSize, exportSize);

    let cursorY = exportSize + gap;
    if(badgeText){
      const bx = (canvas.width - badgeW)/2;
      const by = cursorY;
      ctx.fillStyle = badgeColor;
      const r = badgeH/2;
      ctx.beginPath();
      ctx.moveTo(bx+r, by);
      ctx.arcTo(bx+badgeW, by, bx+badgeW, by+badgeH, r);
      ctx.arcTo(bx+badgeW, by+badgeH, bx, by+badgeH, r);
      ctx.arcTo(bx, by+badgeH, bx, by, r);
      ctx.arcTo(bx, by, bx+badgeW, by, r);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#062017';
      ctx.font = `700 ${badgeFontPx}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, canvas.width/2, by + badgeH/2 + badgeFontPx*0.03);

      cursorY += badgeH + gap;
    }

    if(description){
      ctx.fillStyle = '#5b7568';
      ctx.font = `500 ${descFontPx}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(description, canvas.width/2, cursorY + descH/2);
    }

    URL.revokeObjectURL(url);
    const mime = extension === 'jpeg' ? 'image/jpeg' : 'image/png';
    const dataUrl = canvas.toDataURL(mime, 0.95);
    triggerDownload(dataUrl, `rl-qr-generator-pro.${extension === 'jpeg' ? 'jpg' : 'png'}`);
  }

  // Composites the QR + badge pill + description into one vector SVG file
  async function exportSvg(){
    const qr = buildExportQR();
    const blob = await qr.getRawData('svg');
    const rawSvgText = await blob.text();
    const match = rawSvgText.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
    const innerContent = match ? match[1] : '';

    const { text: badgeText, color: badgeColor, description } = getBadgeInfo();
    const badgeFontPx = Math.round(exportSize * 0.045);
    const descFontPx = Math.round(exportSize * 0.03);
    const badgePadX = Math.round(badgeFontPx * 1.1);
    const badgePadY = Math.round(badgeFontPx * 0.55);
    const gap = Math.round(exportSize * 0.035);

    let extraH = 0;
    let badgeMarkup = '';
    let badgeW = 0, badgeH = 0, badgeY = exportSize + gap;
    if(badgeText){
      badgeW = measureTextWidth(badgeText, badgeFontPx, 700, "Arial, sans-serif") + badgePadX*2;
      badgeH = badgeFontPx + badgePadY*2;
      const bx = (exportSize - badgeW)/2;
      badgeMarkup = `
        <rect x="${bx}" y="${badgeY}" width="${badgeW}" height="${badgeH}" rx="${badgeH/2}" fill="${badgeColor}"/>
        <text x="${exportSize/2}" y="${badgeY + badgeH/2}" text-anchor="middle" dominant-baseline="central"
          font-family="Arial, sans-serif" font-weight="700" font-size="${badgeFontPx}" fill="#062017">${escapeXml(badgeText)}</text>`;
      extraH += gap + badgeH;
    }

    let descMarkup = '';
    if(description){
      const descY = exportSize + extraH + gap + descFontPx/2;
      descMarkup = `
        <text x="${exportSize/2}" y="${descY}" text-anchor="middle" dominant-baseline="central"
          font-family="Arial, sans-serif" font-weight="500" font-size="${descFontPx}" fill="#5b7568">${escapeXml(description)}</text>`;
      extraH += gap + Math.round(descFontPx*1.4);
    }

    const totalH = exportSize + extraH;
    const bgRect = (!state.transparentBg)
      ? `<rect width="${exportSize}" height="${totalH}" fill="${state.bgColor}"/>`
      : '';

    const composite = `<?xml version="1.0" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${exportSize}" height="${totalH}" viewBox="0 0 ${exportSize} ${totalH}">
${bgRect}
${innerContent}
${badgeMarkup}
${descMarkup}
</svg>`;

    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(composite);
    triggerDownload(dataUrl, 'rl-qr-generator-pro.svg');
  }

  // ---- Optional print-page layouts (A4/A5, portrait/landscape) ----
  // These do NOT change the default download behavior above — they only
  // run when the person explicitly picks a layout from the dropdown.
  const PRINT_LAYOUTS = {
    'a4-portrait-half': { pageWmm:210, pageHmm:297, contentWFrac:1,   contentHFrac:0.5 },
    'a5-portrait':      { pageWmm:148, pageHmm:210, contentWFrac:1,   contentHFrac:1   },
    'a4-landscape-half':{ pageWmm:297, pageHmm:210, contentWFrac:0.5, contentHFrac:1   },
    'a5-landscape':     { pageWmm:210, pageHmm:148, contentWFrac:1,   contentHFrac:1   },
  };
  function mmToPx(mm){ return Math.round(mm/25.4*300); } // 300 DPI print quality

  async function exportPrintRaster(extension, layoutKey){
    const layout = PRINT_LAYOUTS[layoutKey];
    const pageWpx = mmToPx(layout.pageWmm);
    const pageHpx = mmToPx(layout.pageHmm);
    const contentWpx = Math.round(pageWpx * layout.contentWFrac);
    const contentHpx = Math.round(pageHpx * layout.contentHFrac);

    const qr = buildExportQR();
    const blob = await qr.getRawData('png');
    const url = URL.createObjectURL(blob);
    const img = await new Promise((resolve, reject)=>{
      const im = new Image();
      im.onload = ()=>resolve(im);
      im.onerror = reject;
      im.src = url;
    });

    const { text: badgeText, color: badgeColor, description } = getBadgeInfo();
    const badgeFontPx = Math.round(exportSize * 0.045);
    const descFontPx = Math.round(exportSize * 0.03);
    const badgePadX = Math.round(badgeFontPx * 1.1);
    const badgePadY = Math.round(badgeFontPx * 0.55);
    const gap = Math.round(exportSize * 0.035);

    let extraH = 0, badgeW = 0, badgeH = 0;
    if(badgeText){
      badgeW = measureTextWidth(badgeText, badgeFontPx, 700, "Arial, sans-serif") + badgePadX*2;
      badgeH = badgeFontPx + badgePadY*2;
      extraH += gap + badgeH;
    }
    let descH = 0;
    if(description){
      descH = Math.round(descFontPx * 1.4);
      extraH += gap + descH;
    }

    const blockW = exportSize;
    const blockH = exportSize + extraH;

    // Fit the QR+badge+description block inside the content area with margin,
    // never upscaling beyond the resolution the person actually chose.
    const marginFrac = 0.08;
    const maxW = contentWpx * (1 - marginFrac*2);
    const maxH = contentHpx * (1 - marginFrac*2);
    const scale = Math.min(maxW/blockW, maxH/blockH, 1);

    const drawW = blockW * scale;
    const drawH = blockH * scale;
    const offsetX = (contentWpx - drawW)/2;
    const offsetY = (contentHpx - drawH)/2;

    const canvas = document.createElement('canvas');
    canvas.width = pageWpx;
    canvas.height = pageHpx;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(img, offsetX, offsetY, exportSize*scale, exportSize*scale);

    let cursorY = offsetY + exportSize*scale + gap*scale;
    if(badgeText){
      const bw = badgeW*scale, bh = badgeH*scale;
      const bx = offsetX + (drawW - bw)/2;
      const by = cursorY;
      ctx.fillStyle = badgeColor;
      const r = bh/2;
      ctx.beginPath();
      ctx.moveTo(bx+r, by);
      ctx.arcTo(bx+bw, by, bx+bw, by+bh, r);
      ctx.arcTo(bx+bw, by+bh, bx, by+bh, r);
      ctx.arcTo(bx, by+bh, bx, by, r);
      ctx.arcTo(bx, by, bx+bw, by, r);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#062017';
      ctx.font = `700 ${badgeFontPx*scale}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, offsetX + drawW/2, by + bh/2 + badgeFontPx*scale*0.03);

      cursorY += bh + gap*scale;
    }

    if(description){
      ctx.fillStyle = '#5b7568';
      ctx.font = `500 ${descFontPx*scale}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(description, offsetX + drawW/2, cursorY + (descH*scale)/2);
    }

    URL.revokeObjectURL(url);
    const mime = extension === 'jpeg' ? 'image/jpeg' : 'image/png';
    const dataUrl = canvas.toDataURL(mime, 0.95);
    triggerDownload(dataUrl, `rl-qr-generator-pro-${layoutKey}.${extension === 'jpeg' ? 'jpg' : 'png'}`);
  }

  async function exportPrintSvg(layoutKey){
    const layout = PRINT_LAYOUTS[layoutKey];
    const pageWpx = mmToPx(layout.pageWmm);
    const pageHpx = mmToPx(layout.pageHmm);
    const contentWpx = Math.round(pageWpx * layout.contentWFrac);
    const contentHpx = Math.round(pageHpx * layout.contentHFrac);

    const qr = buildExportQR();
    const blob = await qr.getRawData('svg');
    const rawSvgText = await blob.text();
    const match = rawSvgText.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
    const innerContent = match ? match[1] : '';

    const { text: badgeText, color: badgeColor, description } = getBadgeInfo();
    const badgeFontPx = Math.round(exportSize * 0.045);
    const descFontPx = Math.round(exportSize * 0.03);
    const badgePadX = Math.round(badgeFontPx * 1.1);
    const badgePadY = Math.round(badgeFontPx * 0.55);
    const gap = Math.round(exportSize * 0.035);

    let extraH = 0, badgeMarkup = '', badgeW = 0, badgeH = 0;
    if(badgeText){
      badgeW = measureTextWidth(badgeText, badgeFontPx, 700, "Arial, sans-serif") + badgePadX*2;
      badgeH = badgeFontPx + badgePadY*2;
      const badgeY = exportSize + gap;
      const bx = (exportSize - badgeW)/2;
      badgeMarkup = `
        <rect x="${bx}" y="${badgeY}" width="${badgeW}" height="${badgeH}" rx="${badgeH/2}" fill="${badgeColor}"/>
        <text x="${exportSize/2}" y="${badgeY + badgeH/2}" text-anchor="middle" dominant-baseline="central"
          font-family="Arial, sans-serif" font-weight="700" font-size="${badgeFontPx}" fill="#062017">${escapeXml(badgeText)}</text>`;
      extraH += gap + badgeH;
    }
    let descMarkup = '';
    if(description){
      const descY = exportSize + extraH + gap + descFontPx/2;
      descMarkup = `
        <text x="${exportSize/2}" y="${descY}" text-anchor="middle" dominant-baseline="central"
          font-family="Arial, sans-serif" font-weight="500" font-size="${descFontPx}" fill="#5b7568">${escapeXml(description)}</text>`;
      extraH += gap + Math.round(descFontPx*1.4);
    }

    const blockW = exportSize;
    const blockH = exportSize + extraH;

    const marginFrac = 0.08;
    const maxW = contentWpx * (1 - marginFrac*2);
    const maxH = contentHpx * (1 - marginFrac*2);
    const scale = Math.min(maxW/blockW, maxH/blockH, 1);

    const drawW = blockW * scale;
    const drawH = blockH * scale;
    const offsetX = (contentWpx - drawW)/2;
    const offsetY = (contentHpx - drawH)/2;

    const composite = `<?xml version="1.0" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${pageWpx}" height="${pageHpx}" viewBox="0 0 ${pageWpx} ${pageHpx}">
<rect width="${pageWpx}" height="${pageHpx}" fill="#ffffff"/>
<g transform="translate(${offsetX},${offsetY}) scale(${scale})">
${innerContent}
${badgeMarkup}
${descMarkup}
</g>
</svg>`;

    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(composite);
    triggerDownload(dataUrl, `rl-qr-generator-pro-${layoutKey}.svg`);
  }

  document.getElementById('dlPng').addEventListener('click', ()=>{
    const layout = document.getElementById('printLayout').value;
    if(layout === 'none'){ exportRaster('png'); } else { exportPrintRaster('png', layout); }
  });
  document.getElementById('dlSvg').addEventListener('click', ()=>{
    const layout = document.getElementById('printLayout').value;
    if(layout === 'none'){ exportSvg(); } else { exportPrintSvg(layout); }
  });
  document.getElementById('dlJpg').addEventListener('click', ()=>{
    const layout = document.getElementById('printLayout').value;
    if(layout === 'none'){ exportRaster('jpeg'); } else { exportPrintRaster('jpeg', layout); }
  });

  document.getElementById('copyYear').textContent = new Date().getFullYear();

  // Initial render
  render(false);
})();
