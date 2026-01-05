const userLayoutConfig = [
  { id: 1, posClass: "area_top", titleClass: "" },
  { id: 2, posClass: "area_right", titleClass: "" },
  { id: 3, posClass: "area_bottom01", titleClass: "" },
  { id: 4, posClass: "area_bottom02", titleClass: "" },
  { id: 5, posClass: "area_left", titleClass: "" }
];

const USER_SLOT_COUNT = 5;

const state = {
  userProfiles: Array.from({ length: USER_SLOT_COUNT }, (_, index) => ({
    id: index + 1,
    nickname: "",
    titlePos: "bottom",
    prefImages: [],
  })),
};

state.users = state.userProfiles;
window.state = state;

async function decodeDataUrlImage(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) return false;

  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = async () => {
      try {
        if (typeof img.decode === "function") await img.decode();
      } catch (_) {}
      resolve(true);
    };
    img.onerror = () => resolve(false);
    img.src = dataUrl;
  });
}

function setImageSrc(imgEl, src) {
  if (!imgEl) return;

  if (src) {
    imgEl.setAttribute("src", src);
    if (typeof src === "string" && src.startsWith("data:image/")) {
      decodeDataUrlImage(src);
    }
  } else {
    imgEl.removeAttribute("src");
  }
}

function renderPreviewState() {
  for (let i = 0; i < state.userProfiles.length; i++) {
    const user = state.userProfiles[i];

    const prefImages = user.prefImages || [];
    const firstImage = prefImages[0];

    const userRootEl = document.querySelector(`.circle_area[data-user="${user.id}"]`);
    if (!userRootEl) continue;

    const userAreaEl = userRootEl.querySelector(".user_area");
    if (userAreaEl) {
      userAreaEl.classList.remove("title_top", "title_bottom");
      userAreaEl.classList.add(user.titlePos === "bottom" ? "title_bottom" : "title_top");
    }

    const titleEl = userRootEl.querySelector(".user_title");
    if (titleEl) {
      titleEl.textContent = user.nickname
        ? `${user.nickname}`
        : `user${String(user.id).padStart(2, "0")}`;
    }

    const userIcon = userRootEl.querySelector(".user_icon");
    const userImg = userRootEl.querySelector(".user_icon img");

    if (userIcon && userImg) {
      if (user.icon) {
        setImageSrc(userImg, user.icon);
        userIcon.classList.add("has_img");
      } else {
        userImg.removeAttribute("src");
        userIcon.classList.remove("has_img");
      }
    }

    const prefImageEls = userRootEl.querySelectorAll(".circle_item img");

    for (let j = 0; j < prefImageEls.length; j++) {
      const img = prefImageEls[j];
      const item = img.closest(".circle_item");
      const src = prefImages[j];

      if (src) {
        setImageSrc(img, src);
        if (item) item.classList.add("has_img");
      } else {
        img.removeAttribute("src");
        if (item) item.classList.remove("has_img");
      }
    }
  }

  if (typeof window.__prefCaptureInvalidate === "function") {
    window.__prefCaptureInvalidate();
  }
  if (typeof window.__prefCaptureSchedule === "function") {
    window.__prefCaptureSchedule();
  }
}

window.renderPreviewState = renderPreviewState;

function renderPreviewLayout(userLayoutConfig) {
  const host = document.getElementById("previewPref");
  if (!host) return;

  let previewHtml = "";

  for (let i = 0; i < userLayoutConfig.length; i++) {
    const user = userLayoutConfig[i];

    let circleItemHtml = "";
    for (let j = 0; j < 6; j++) {
      circleItemHtml += `
        <div class="circle_item">
          <img>
        </div>
      `;
    }

    previewHtml += `
      <div class="circle_area ${user.posClass}" data-user="${user.id}">
        <div class="user_area ${user.titleClass}">
          <div class="user_title"></div>
          <div class="user_icon">
            <img>
            <span class="empty_q" aria-hidden="true">?</span>
          </div>
        </div>
        <div class="circle">
          <div class="circle_grid">
            ${circleItemHtml}
          </div>
        </div>
      </div>
    `;
  }
  
  host.innerHTML = previewHtml;
}

renderPreviewLayout(userLayoutConfig);
renderPreviewState();


function isIOSSafari() {
  var ua = navigator.userAgent;
  var isIOS = /iP(hone|od|ad)/.test(ua);
  var isWebkit = /WebKit/.test(ua);
  var isNotCriOS = !/CriOS/.test(ua);
  return isIOS && isWebkit && isNotCriOS;
}

function sleep(ms) {
  return new Promise(function (r) {
    setTimeout(r, ms);
  });
}

function waitImagesReady(imgEls, timeoutMs) {
  timeoutMs = timeoutMs || (isIOSSafari() ? 8000 : 3500);

  return Promise.all(
    imgEls.map(function (img) {
      return new Promise(function (resolve) {
        if (!img) return resolve(false);
        if (img.complete && img.naturalWidth > 0) return resolve(true);

        var done = false;
        function finish(ok) {
          if (done) return;
          done = true;
          cleanup();
          resolve(ok);
        }

        function onLoad() {
          finish(true);
        }
        function onError() {
          finish(false);
        }

        var timer = setTimeout(function () {
          finish(img.complete && img.naturalWidth > 0);
        }, timeoutMs);

        function cleanup() {
          clearTimeout(timer);
          img.removeEventListener("load", onLoad);
          img.removeEventListener("error", onError);
        }

        img.addEventListener("load", onLoad, { once: true });
        img.addEventListener("error", onError, { once: true });

        if (typeof img.decode === "function") {
          img.decode()
            .then(function () {
              finish(true);
            })
            .catch(function () {});
        }
      });
    })
  );
}

function getPxNumber(v) {
  var n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function roundedRectPath(ctx, x, y, w, h, r) {
  var rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function drawCircle(ctx, cx, cy, r, fillStyle, strokeStyle, strokeWidth) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);

  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle && strokeWidth) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
}

function drawImageCover(ctx, img, x, y, w, h) {
  var iw = img.naturalWidth || img.width;
  var ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;

  var scale = Math.max(w / iw, h / ih);

  var sw = w / scale;
  var sh = h / scale;

  var sx = (iw - sw) / 2;
  var sy = (ih - sh) / 2;

  if (sx < 0) sx = 0;
  if (sy < 0) sy = 0;
  if (sw > iw) sw = iw;
  if (sh > ih) sh = ih;

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawClippedCircleImage(ctx, img, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  drawImageCover(ctx, img, cx - r, cy - r, r * 2, r * 2);

  ctx.restore();
}

function getVisualScale(target) {
  var rect = target.getBoundingClientRect();
  var baseW = target.offsetWidth || rect.width;
  var s = rect.width / Math.max(1, baseW);
  if (!Number.isFinite(s) || s <= 0) s = 1;
  return s;
}

async function capturePreviewToPngBlob1440() {
  var target = document.querySelector(".preview_panel .content");
  if (!target) return null;

  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (_) {}
  }

  await new Promise(function (r) {
    requestAnimationFrame(function () {
      requestAnimationFrame(r);
    });
  });

  var baseW = target.offsetWidth;
  var baseH = target.offsetHeight;

  if (!baseW || !baseH) {
    var tmp = target.getBoundingClientRect();
    baseW = Math.round(tmp.width);
    baseH = Math.round(tmp.height);
  }

  var visualScale = getVisualScale(target);

  var OUT = 1440;
  var CAPTURE_RATIO = 2;

  CAPTURE_RATIO = Math.max(CAPTURE_RATIO, OUT / Math.max(1, baseW));

  var MAX_RATIO = isIOSSafari() ? 3 : 4;
  CAPTURE_RATIO = Math.min(CAPTURE_RATIO, MAX_RATIO);

  var cw = Math.max(1, Math.round(baseW * CAPTURE_RATIO));
  var ch = Math.max(1, Math.round(baseH * CAPTURE_RATIO));

  var captured = document.createElement("canvas");
  captured.width = cw;
  captured.height = ch;

  var ctx = captured.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  var csContent = window.getComputedStyle(target);
  var radius = getPxNumber(csContent.borderRadius) * CAPTURE_RATIO;
  var bgColor = csContent.backgroundColor || "#fff";

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, cw, ch);

  ctx.save();

  var shadow = csContent.boxShadow;
  if (shadow && shadow !== "none") {
    var m = shadow.match(
      /(-?\d+px)\s+(-?\d+px)\s+(\d+px)(?:\s+(\d+px))?\s+(rgba?\([^)]+\))/i
    );
    if (m) {
      ctx.shadowOffsetX = getPxNumber(m[1]) * CAPTURE_RATIO;
      ctx.shadowOffsetY = getPxNumber(m[2]) * CAPTURE_RATIO;
      ctx.shadowBlur = getPxNumber(m[3]) * CAPTURE_RATIO;
      ctx.shadowColor = m[5];
    }
  }

  roundedRectPath(ctx, 0, 0, cw, ch, radius);
  ctx.fillStyle = bgColor;
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.clip();

  var rect = target.getBoundingClientRect();

  var bgCircles = Array.from(target.querySelectorAll(".bg_circle"));
  for (var i = 0; i < bgCircles.length; i++) {
    var el = bgCircles[i];
    var er = el.getBoundingClientRect();

    var lx = (er.left - rect.left) / visualScale;
    var ly = (er.top - rect.top) / visualScale;
    var lw = er.width / visualScale;

    var cx = (lx + lw / 2) * CAPTURE_RATIO;
    var cy = (ly + lw / 2) * CAPTURE_RATIO;
    var r = (lw / 2) * CAPTURE_RATIO;

    var bg = window.getComputedStyle(el).backgroundColor || "rgba(0,0,0,0.09)";
    drawCircle(ctx, cx, cy, r, bg, null, 0);
  }

  var iconImgs = Array.from(target.querySelectorAll(".user_icon img"));
  var prefImgs = Array.from(target.querySelectorAll(".circle_item img"));
  var allImgs = iconImgs.concat(prefImgs).filter(function (img) {
    var src = img.getAttribute("src") || img.src;
    return src && src !== "undefined" && src !== "null";
  });

  await waitImagesReady(allImgs);

  var userIcons = Array.from(target.querySelectorAll(".user_icon"));
  for (var j = 0; j < userIcons.length; j++) {
    var icon = userIcons[j];
    var imgEl = icon.querySelector("img");
    var ir = icon.getBoundingClientRect();

    var lx2 = (ir.left - rect.left) / visualScale;
    var ly2 = (ir.top - rect.top) / visualScale;
    var lw2 = ir.width / visualScale;
    var lh2 = ir.height / visualScale;

    var x = lx2 * CAPTURE_RATIO;
    var y = ly2 * CAPTURE_RATIO;
    var w = lw2 * CAPTURE_RATIO;
    var h = lh2 * CAPTURE_RATIO;

    var cx2 = x + w / 2;
    var cy2 = y + h / 2;
    var r2 = Math.min(w, h) / 2;

    drawCircle(ctx, cx2, cy2, r2, "#fff", null, 0);

    var src2 = imgEl ? (imgEl.getAttribute("src") || imgEl.src) : "";
    if (imgEl && src2 && imgEl.naturalWidth > 0) {
      drawClippedCircleImage(ctx, imgEl, cx2, cy2, r2);
    } else {
      var qEl = icon.querySelector(".empty_q");
      if (qEl) {
        var qText = (qEl.textContent || "?").trim() || "?";
        var qStyle = window.getComputedStyle(qEl);

        var qFontSize = getPxNumber(qStyle.fontSize) * CAPTURE_RATIO;
        var qFontWeight = qStyle.fontWeight || "800";
        var qFontFamily = qStyle.fontFamily || "sans-serif";
        var qColor = qStyle.color || "#111";
        var qOpacity = parseFloat(qStyle.opacity);
        if (!Number.isFinite(qOpacity)) qOpacity = 1;

        ctx.save();
        ctx.fillStyle = qColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = qFontWeight + " " + qFontSize + "px " + qFontFamily;

        var prevAlpha = ctx.globalAlpha;
        ctx.globalAlpha = prevAlpha * qOpacity;

        var yOffset = 0;
        ctx.fillText(qText, cx2, cy2 + yOffset);

        ctx.globalAlpha = prevAlpha;
        ctx.restore();
      }
    }

    var csIcon = window.getComputedStyle(icon);
    var borderColor = csIcon.borderColor || "#000";
    var borderW = getPxNumber(csIcon.borderWidth) * CAPTURE_RATIO;

    drawCircle(ctx, cx2, cy2, r2 - borderW / 2, null, borderColor, borderW);
  }

  var items = Array.from(target.querySelectorAll(".circle_item"));
  for (var k = 0; k < items.length; k++) {
    var item = items[k];
    var imgEl2 = item.querySelector("img");
    var rr = item.getBoundingClientRect();

    var lx3 = (rr.left - rect.left) / visualScale;
    var ly3 = (rr.top - rect.top) / visualScale;
    var lw3 = rr.width / visualScale;
    var lh3 = rr.height / visualScale;

    var x2 = lx3 * CAPTURE_RATIO;
    var y2 = ly3 * CAPTURE_RATIO;
    var w2 = lw3 * CAPTURE_RATIO;
    var h2 = lh3 * CAPTURE_RATIO;

    ctx.fillStyle = "#fff";
    ctx.fillRect(x2, y2, w2, h2);

    var src3 = imgEl2 ? (imgEl2.getAttribute("src") || imgEl2.src) : "";
    if (imgEl2 && src3 && imgEl2.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x2, y2, w2, h2);
      ctx.clip();

      drawImageCover(ctx, imgEl2, x2, y2, w2, h2);

      ctx.restore();
    }
  }

  var prefTitleEl = target.querySelector(".pref_title");
  if (prefTitleEl) {
    var spans = Array.from(prefTitleEl.querySelectorAll("span"));
    var lines = spans
      .map(function (s) { return (s.textContent || "").trim(); })
      .filter(Boolean);

    if (lines.length === 0) {
      var fallback = (prefTitleEl.innerText || prefTitleEl.textContent || "").trim();
      if (fallback) lines = fallback.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    }

    if (lines.length > 0) {
      var pr = prefTitleEl.getBoundingClientRect();

      var lx = (pr.left - rect.left) / visualScale;
      var ly = (pr.top - rect.top) / visualScale;
      var lw = pr.width / visualScale;
      var lh = pr.height / visualScale;

      var x = lx * CAPTURE_RATIO;
      var y = ly * CAPTURE_RATIO;
      var w = lw * CAPTURE_RATIO;
      var h = lh * CAPTURE_RATIO;

      var cs = window.getComputedStyle(prefTitleEl);

      var fontSize = getPxNumber(cs.fontSize) * CAPTURE_RATIO;
      var fontWeight = cs.fontWeight || "700";
      var fontFamily = cs.fontFamily || "sans-serif";
      var color = cs.color || "#000";

      var lhCss = cs.lineHeight;
      var lineH = (lhCss === "normal" || !lhCss)
        ? fontSize * 1.2
        : getPxNumber(lhCss) * CAPTURE_RATIO;

      ctx.save();
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = fontWeight + " " + fontSize + "px " + fontFamily;

      var totalH = lines.length * lineH;
      var startY = y + h / 2 - totalH / 2 + lineH / 2;

      for (var i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], x + w / 2, startY + i * lineH);
      }

      ctx.restore();
    }
  }

  var titles = Array.from(target.querySelectorAll(".user_title"));
  for (var t = 0; t < titles.length; t++) {
    var titleEl = titles[t];
    var text = (titleEl.textContent || "").trim();
    if (!text) continue;

    var tr = titleEl.getBoundingClientRect();

    var lx4 = (tr.left - rect.left) / visualScale;
    var ly4 = (tr.top - rect.top) / visualScale;
    var lw4 = tr.width / visualScale;
    var lh4 = tr.height / visualScale;

    var x3 = lx4 * CAPTURE_RATIO;
    var y3 = ly4 * CAPTURE_RATIO;
    var w3 = lw4 * CAPTURE_RATIO;
    var h3 = lh4 * CAPTURE_RATIO;

    var cs = window.getComputedStyle(titleEl);
    var fontSize = getPxNumber(cs.fontSize) * CAPTURE_RATIO;
    var fontWeight = cs.fontWeight || "700";
    var fontFamily = cs.fontFamily || "sans-serif";
    var color = cs.color || "#000";

    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = fontWeight + " " + fontSize + "px " + fontFamily;

    ctx.fillText(text, x3 + w3 / 2, y3 + h3 / 2);
  }

  ctx.restore();

  var out = document.createElement("canvas");
  out.width = 1440;
  out.height = 1440;

  var octx = out.getContext("2d");
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = "high";
  octx.fillStyle = "#fff";
  octx.fillRect(0, 0, 1440, 1440);

  var sw = captured.width;
  var sh = captured.height;

  var s = Math.min(1440 / sw, 1440 / sh);
  var dw = Math.round(sw * s);
  var dh = Math.round(sh * s);
  var dx = Math.round((1440 - dw) / 2);
  var dy = Math.round((1440 - dh) / 2);

  octx.drawImage(captured, dx, dy, dw, dh);

  var blob = await new Promise(function (resolve) {
    out.toBlob(function (b) {
      resolve(b);
    }, "image/png");
  });

  return blob || null;
}

var captureCache = {
  ready: false,
  building: false,
  pendingPromise: null,
  cache: null,
  timer: null
};

function revokeCaptureCacheUrl() {
  if (captureCache.cache && captureCache.cache.url) {
    try {
      URL.revokeObjectURL(captureCache.cache.url);
    } catch (_) {}
  }
  captureCache.cache = null;
}

function prefCaptureInvalidate() {
  captureCache.ready = false;
  captureCache.building = false;
  captureCache.pendingPromise = null;

  if (captureCache.timer) {
    clearTimeout(captureCache.timer);
    captureCache.timer = null;
  }

  revokeCaptureCacheUrl();
}

function prefCaptureSchedule(delayMs) {
  delayMs = typeof delayMs === "number" ? delayMs : 700;

  if (captureCache.timer) clearTimeout(captureCache.timer);

  captureCache.timer = setTimeout(function () {
    captureCache.timer = null;

    function run() {
      buildPreviewCaptureCache().catch(function () {});
    }

    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(run, { timeout: 2000 });
    } else {
      setTimeout(run, 0);
    }
  }, delayMs);
}

async function buildPreviewCaptureCache() {
  if (captureCache.ready && captureCache.cache && captureCache.cache.url) {
    return captureCache.cache.url;
  }
  if (captureCache.building && captureCache.pendingPromise) {
    return captureCache.pendingPromise;
  }

  var p = (async function () {
    captureCache.building = true;

    try {
      var blob = await capturePreviewToPngBlob1440();
      if (!blob) return null;

      revokeCaptureCacheUrl();
      var url = URL.createObjectURL(blob);

      captureCache.cache = { blob: blob, url: url, createdAt: Date.now() };
      captureCache.ready = true;

      return url;
    } catch (e) {
      console.error("buildPreviewCaptureCache error:", e);
      return null;
    } finally {
      captureCache.building = false;
      captureCache.pendingPromise = null;
    }
  })();

  captureCache.pendingPromise = p;
  return p;
}

async function downloadPreviewPng() {
  if (!captureCache.ready) {
    await buildPreviewCaptureCache();
  }
  if (!captureCache.cache || !captureCache.cache.url) return;

  var url = captureCache.cache.url;

  if (isIOSSafari()) {
    window.open(url, "_blank");
    return;
  }

  var link = document.createElement("a");
  link.href = url;
  link.download = "taste-map-1440.png";
  link.click();
}

function updatePreviewScale() {
  const viewport = document.querySelector('.preview_viewport');
  const scaleEl = document.querySelector('.preview_scale');

  if (!viewport || !scaleEl) return;

  const vw = viewport.clientWidth;
  const canvas = 900;
  const scale = Math.min(vw / canvas, 1);

  scaleEl.style.transform = `scale(${scale})`;
  scaleEl.style.transformOrigin = 'center center';
}

window.addEventListener('resize', updatePreviewScale);
updatePreviewScale();
  
window.prefCaptureInvalidate = prefCaptureInvalidate;
window.prefCaptureSchedule = prefCaptureSchedule;
window.buildPreviewCaptureCache = buildPreviewCaptureCache;
window.downloadPreviewPng = downloadPreviewPng;