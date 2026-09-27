#!/usr/bin/env python3
"""
Renders the OUAQT Arabic teaser, a vertical 1080x1920 film:

    إنّه يومٌ جديد  /  اللعبة تغيّرت   ->   the OUAQT logo over a sunrise

A word at a time sits on the crest of a curved horizon while the material
under it cuts from one texture to the next, faster and faster; then the sky
goes dark, the logo draws itself like a clock hand going round, and the sun
comes up behind it. Every texture, the type, the logo animation and the
soundtrack are made here, so the film can be re-rendered from the repo.

    pip install numpy opencv-python-headless pillow scipy fonttools brotli imageio-ffmpeg
    python scripts/brand-video/render.py                       # full film
    python scripts/brand-video/render.py --sheet sheet.png     # one still per texture
    python scripts/brand-video/render.py --frames 150,300,560  # PNG stills

Pillow must have raqm (the pip wheels do) so Arabic is shaped. The fonts
(Noto Naskh Arabic for the words, Aref Ruqaa for the ledger's handwriting)
are fetched once from npm into .cache/, next to this file.
"""
import argparse
import math
import os
import shutil
import subprocess
import sys
import tarfile
import tempfile
import wave
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import signal
from scipy.spatial import cKDTree

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
CACHE = HERE / ".cache"
LOGO = ROOT / "public" / "logo-ouaqt-dark-ink.png"
OUT = ROOT / "public" / "video" / "ouaqt-new-day-ar.mp4"

W, H, FPS = 1080, 1920, 30
TOP = 930                # crest of the horizon arc: every word sits on it
MT = TOP - 150           # first row the material layer covers
HR = H - MT
TEXT_R = 1650.0          # the words bend along an arc of this radius

IVORY = (0.957, 0.945, 0.910)
INK = (0.055, 0.055, 0.060)
RED = (0.93, 0.13, 0.14)

cv2.setNumThreads(os.cpu_count() or 4)
Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
RY, RX = Y[MT:], X[MT:]

# ---------------------------------------------------------------- the script

WORDS = ["إنّه", "يومٌ جديد", "اللعبة", "تغيّرت"]

# Cut lengths in frames, grouped by the word on screen (None: no word).
OPENING = 36
PRE = [28, 24, 12, 7, 7, 14, 12]
W1 = [13, 12, 14]
W2 = [12, 11, 12, 10, 11, 10]
STROBE = 16
W3 = [12, 11, 10, 9]
W4 = [9, 8, 8, 7, 7, 6, 6, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 3, 2, 2, 12]
DARK_TO_LOGO = 12        # a beat of dark before the logo draws
LOGO_HOLD = 80           # from the dark cut to the sun starting to rise
SUNRISE = 96
END_HOLD = 40

# Texture per cut, in order. Neighbours differ in light and colour.
ORDER = (
    ["sand", "indigo", "zellige", "leaf", "ember", "blueprint", "pomegranate"]
    + ["thinfilm", "tannery", "agate"]
    + ["amber", "collage", "guilloche", "clay", "mashrabiya", "dandelion"]
    + ["ledger", "thermal", "copper", "cells"]
    + ["water", "zellige", "saffron", "sand", "agate", "collage", "ember",
       "tannery", "blueprint", "leaf", "guilloche", "indigo", "pomegranate",
       "cells", "copper", "thermal", "dandelion", "mashrabiya", "thinfilm",
       "amber", "night"]
)


def timeline():
    """Segments as (kind, frames, info) and the word shown on each frame."""
    segs = [("dawn", OPENING, None)]
    for group, word in ((PRE, None), (W1, 0), (W2, 1)):
        segs += [("clip", n, word) for n in group]
    segs += [("strobe", 1, None)] * STROBE
    for group, word in ((W3, 2), (W4, 3)):
        segs += [("clip", n, word) for n in group]
    segs.append(("end", LOGO_HOLD + SUNRISE + END_HOLD, None))
    return segs


# ------------------------------------------------------------------- helpers

def f32(c):
    return np.array(c, np.float32)


def noise(rng, cell, h=HR, w=W, cellx=None):
    """Smooth value noise: a random grid blown up bicubically."""
    cy, cx = float(cell), float(cellx or cell)
    gh, gw = int(h / cy) + 4, int(w / cx) + 4
    g = rng.random((gh, gw), dtype=np.float32)
    big = cv2.resize(g, (int(gw * cx), int(gh * cy)), interpolation=cv2.INTER_CUBIC)
    oy, ox = int(rng.integers(0, max(1, int(cy)))), int(rng.integers(0, max(1, int(cx))))
    return big[oy:oy + h, ox:ox + w]


def fbm(rng, cell, octaves=5, gain=0.5, h=HR, w=W, aspect=1.0):
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for _ in range(octaves):
        if cell < 2:
            break
        out += amp * noise(rng, cell, h, w, cell * aspect)
        tot += amp
        amp *= gain
        cell /= 2
    return out / tot


def stretch(a, k=0.2):
    return np.clip(0.5 + k * (a - a.mean()) / (a.std() + 1e-6), 0, 1).astype(np.float32)


def warp(img, dx, dy):
    mx = (RX + dx).astype(np.float32)
    my = (RY - MT + dy).astype(np.float32)
    return cv2.remap(img, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def ramp(v, stops):
    pos = [s[0] for s in stops]
    cols = np.array([s[1] for s in stops], np.float32)
    xs = np.linspace(0, 1, 1024)
    lut = np.stack([np.interp(xs, pos, cols[:, c]) for c in range(3)], -1).astype(np.float32)
    return lut[(np.clip(v, 0, 1) * 1023).astype(np.int32)]


def normals(hgt, k=1.0):
    hgt = np.asarray(hgt, np.float32)
    gx = cv2.Sobel(hgt, cv2.CV_32F, 1, 0, ksize=3) * (k / 8)
    gy = cv2.Sobel(hgt, cv2.CV_32F, 0, 1, ksize=3) * (k / 8)
    n = np.dstack([-gx, -gy, np.ones_like(hgt)])
    return n / np.linalg.norm(n, axis=2, keepdims=True)


def lambert(n, light):
    L = f32(light) / np.linalg.norm(light)
    return np.clip(n @ L, 0, 1)


def specular(n, light, power):
    L = f32(light) / np.linalg.norm(light)
    h = L + f32((0, 0, 1))
    h /= np.linalg.norm(h)
    return np.clip(n @ h, 0, 1) ** power


def smooth(a, lo, hi):
    t = np.clip((a - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def plane(y0):
    """Coordinates on a floor tilting away toward the crest: things shrink as
    they near the arc. Units are pixels at the bottom of the frame."""
    yy = np.clip(RY - TOP, 0, None) + y0
    c = H - TOP + y0
    return (RX - W / 2) * c / yy, -c * c / yy


def voronoi(rng, pts, u, v, k=2):
    tree = cKDTree(pts)
    d, i = tree.query(np.stack([u.ravel(), v.ravel()], -1), k=k, workers=-1)
    return d.reshape(u.shape + (k,)).astype(np.float32), i.reshape(u.shape + (k,))


def jitter_grid(rng, spacing, x0, x1, y0, y1, j=0.45):
    ys, xs = np.mgrid[y0:y1:spacing, x0:x1:spacing]
    p = np.stack([xs.ravel(), ys.ravel()], -1).astype(np.float32)
    return p + rng.uniform(-j, j, p.shape).astype(np.float32) * spacing


def sky_grad(top, low):
    """A vertical gradient: `top` at the top of the frame, `low` at the crest."""
    t = np.clip(Y[:, :1] / TOP, 0, 1)[..., None]
    col = f32(top) * (1 - t) + f32(low) * t
    return np.broadcast_to(col, (H, W, 3)).copy()


class Arc:
    """The horizon: a circle of radius R whose top touches y=TOP."""

    def __init__(self, R, rng=None, rim=None):
        self.R = R
        self.cy = TOP + R
        dx, dy = RX - W / 2, RY - self.cy
        self.r = np.sqrt(dx * dx + dy * dy)
        self.th = np.arctan2(dx, -dy)
        rn = 0
        if rim:
            cell, amp = rim
            n = (noise(rng, cell, 1, W)[0] - 0.5) * 2 * amp
            n += (noise(rng, cell / 4, 1, W)[0] - 0.5) * amp * 0.5
            keep = 0.35 + 0.65 * np.clip(np.abs(np.arange(W) - W / 2) / 300, 0, 1)
            rn = (n * keep).astype(np.float32)[None, :]
        self.d = self.r - R - rn          # < 0 inside the material

    def dist(self, x, y):
        return math.hypot(x - W / 2, y - self.cy) - self.R


def new_layer():
    return np.zeros((HR, W, 3), np.float32), np.zeros((HR, W), np.float32)


def paint(layer, alpha, x0, y0, rgb, a):
    """Paint a small RGBA patch (rgb h*w*3, a h*w) into region coords."""
    h, w = a.shape
    x0, y0 = int(x0), int(y0)
    xa, ya = max(0, x0), max(0, y0)
    xb, yb = min(W, x0 + w), min(HR, y0 + h)
    if xa >= xb or ya >= yb:
        return
    sub_a = a[ya - y0:yb - y0, xa - x0:xb - x0, None]
    sub_c = rgb[ya - y0:yb - y0, xa - x0:xb - x0]
    layer[ya:yb, xa:xb] = layer[ya:yb, xa:xb] * (1 - sub_a) + sub_c * sub_a
    if alpha is not None:
        alpha[ya:yb, xa:xb] = alpha[ya:yb, xa:xb] * (1 - sub_a[..., 0]) + sub_a[..., 0]


# ---------------------------------------------------------------- textures
#
# Each returns dict(mat=HRxWx3 material, sky=HxWx3, arc=Arc, ...) with
# optional over=(rgb, alpha) drawn over the rim and add= light added on top.

def t_sand(rng):
    u, v = plane(900)
    big = fbm(rng, 280, 4)
    wv = (fbm(rng, 200, 3) - 0.5) * 120
    ph = (v + u * 0.2 + wv) / 34.0 * 2 * np.pi
    rip = np.sin(ph) + 0.35 * np.sin(2 * ph + 0.6)
    fade = np.clip((RY - TOP) / 520, 0.08, 1) ** 1.5
    hgt = rip * 3.2 * fade + (big - 0.5) * 170
    lit = lambert(normals(hgt), (-0.85, -0.35, 0.42))
    col = ramp(np.clip(lit * 1.08, 0, 1), [(0, (0.36, 0.20, 0.10)), (0.45, (0.72, 0.48, 0.28)),
                                          (0.8, (0.92, 0.72, 0.50)), (1, (0.99, 0.87, 0.68))])
    col += ((rng.random((HR, W), dtype=np.float32) - 0.5) * 0.07)[..., None]
    return dict(mat=col, sky=sky_grad((0.60, 0.68, 0.78), (0.93, 0.86, 0.76)),
                arc=Arc(1.55 * W, rng, (160, 5)))


def star_sd(px, py, a):
    sq = np.maximum(np.abs(px), np.abs(py)) - a
    di = (np.abs(px) + np.abs(py)) / 1.4142136 - a
    return np.minimum(sq, di)


def t_zellige(rng):
    u, v = plane(1300)
    ang = rng.uniform(-0.12, 0.12)
    u, v = u * math.cos(ang) - v * math.sin(ang), u * math.sin(ang) + v * math.cos(ang)
    s = 175.0
    u = u + rng.uniform(0, s)
    cu, cv_ = np.floor(u / s), np.floor(v / s)
    px, py = u - (cu + 0.5) * s, v - (cv_ + 0.5) * s
    qx, qy = u - np.round(u / s) * s, v - np.round(v / s) * s
    big = star_sd(px, py, 0.30 * s)
    inner = star_sd(px, py, 0.12 * s)
    small = star_sd(qx, qy, 0.15 * s)
    palettes = [
        [(0.09, 0.20, 0.50), (0.80, 0.58, 0.20), (0.03, 0.36, 0.29), (0.93, 0.91, 0.85)],
        [(0.03, 0.36, 0.29), (0.93, 0.91, 0.85), (0.09, 0.20, 0.50), (0.93, 0.91, 0.85)],
        [(0.62, 0.16, 0.10), (0.93, 0.91, 0.85), (0.09, 0.20, 0.50), (0.95, 0.90, 0.80)],
    ]
    c_big, c_inner, c_small, c_bg = [f32(c) for c in palettes[rng.integers(len(palettes))]]
    strap = f32((0.05, 0.08, 0.08))
    col = np.broadcast_to(c_bg, (HR, W, 3)).copy()
    col[big < 0] = c_big
    col[inner < 0] = c_inner
    col[(big >= 0) & (big < 10)] = strap
    col[small < 0] = c_small
    bgm = (big >= 10) & (small >= 0)
    edge = np.minimum.reduce([np.abs(big), np.abs(inner), np.abs(small), np.abs(big - 10)])
    lines = np.minimum(np.minimum(np.abs(px), np.abs(py)), np.abs(np.abs(px) - np.abs(py)) / 1.414)
    edge = np.where(bgm, np.minimum(edge, lines), edge)
    var = rng.uniform(0.88, 1.06, (64, 64)).astype(np.float32)
    col *= var[cv_.astype(int) % 64, cu.astype(int) % 64][..., None]
    grout = smooth(edge, 1.0, 2.6)
    hgt = fbm(rng, 60, 3) * 3 + np.clip(edge, 0, 6) / 6 * 2.5
    n = normals(hgt)
    L = (-0.55, -0.75, 0.55)
    col = col * (0.62 + 0.5 * lambert(n, L))[..., None] + (0.45 * specular(n, L, 60))[..., None]
    col = col * grout[..., None] + f32((0.24, 0.23, 0.21)) * (1 - grout[..., None])
    col = cv2.GaussianBlur(col, (0, 0), 0.7)
    return dict(mat=col, sky=sky_grad((0.01, 0.01, 0.012), (0.05, 0.045, 0.04)),
                arc=Arc(1.5 * W), rim_light=0.35)


def t_saffron(rng):
    arc = Arc(1.5 * W)
    base = ramp(fbm(rng, 120, 4), [(0, (0.09, 0.01, 0.01)), (1, (0.26, 0.05, 0.02))])
    img = (np.clip(base, 0, 1) * 255).astype(np.uint8)
    ov = np.zeros_like(img)
    ova = np.zeros((HR, W), np.uint8)
    deep, hot, tip = f32((0.50, 0.04, 0.02)), f32((0.86, 0.22, 0.05)), f32((0.97, 0.62, 0.16))
    for i in range(1900):
        x0 = rng.uniform(-80, W + 80)
        y0 = rng.uniform(TOP - 40, H + 60) - MT
        a = rng.uniform(0, 2 * np.pi)
        L = rng.uniform(90, 240)
        bend = rng.uniform(-0.7, 0.7)
        p0 = np.array([x0, y0])
        p2 = p0 + L * np.array([math.cos(a), math.sin(a)])
        mid = (p0 + p2) / 2 + bend * L * 0.5 * np.array([-math.sin(a), math.cos(a)])
        t = np.linspace(0, 1, 18)[:, None]
        pts = (1 - t) ** 2 * p0 + 2 * (1 - t) * t * mid + t * t * p2
        top_y = pts[:, 1].min() + MT
        near_rim = arc.dist(x0, y0 + MT) > -70 and top_y > TOP - (15 if abs(x0 - W / 2) < 300 else 60)
        targets = [(img, None)] + ([(ov, ova)] if near_rim and i % 2 == 0 else [])
        for canvas, am in targets:
            for k in range(len(pts) - 1):
                q = k / (len(pts) - 1)
                th = int(2 + 4 * q ** 2)
                c = deep * (1 - q) + hot * q if q < 0.85 else tip
                sh = tuple(int(v) for v in pts[k] + (4, 6)), tuple(int(v) for v in pts[k + 1] + (4, 6))
                cv2.line(canvas, *sh, (18, 2, 1), th + 2, cv2.LINE_AA)
                a0, a1 = tuple(int(v) for v in pts[k]), tuple(int(v) for v in pts[k + 1])
                cv2.line(canvas, a0, a1, tuple(float(v) * 255 for v in c), th, cv2.LINE_AA)
                if am is not None:
                    cv2.line(am, sh[0], sh[1], 255, th + 2, cv2.LINE_AA)
                    cv2.line(am, a0, a1, 255, th, cv2.LINE_AA)
    col = img.astype(np.float32) / 255
    hl = cv2.GaussianBlur(col, (0, 0), 2) * 0.25
    return dict(mat=col + hl, sky=sky_grad((0.0, 0.0, 0.0), (0.06, 0.02, 0.01)), arc=arc,
                over=(ov.astype(np.float32) / 255, ova.astype(np.float32) / 255), rim_light=0.0)


def t_indigo(rng):
    """Indigo ink blooming in water: soft clouds with bright tendrils."""
    q1, q2 = fbm(rng, 360, 5), fbm(rng, 360, 5)
    f = stretch(warp(fbm(rng, 300, 6), (q1 - 0.5) * 700, (q2 - 0.5) * 700), 0.24)
    g = warp(fbm(rng, 140, 5), (q1 - 0.5) * 500, (q2 - 0.5) * 500)
    tendril = (1 - np.abs(2 * stretch(g, 0.3) - 1)) ** 10
    col = ramp(f, [(0, (0.005, 0.01, 0.06)), (0.35, (0.03, 0.06, 0.24)), (0.62, (0.10, 0.18, 0.52)),
                   (0.85, (0.30, 0.44, 0.80)), (1, (0.66, 0.76, 0.95))])
    col += (tendril * f)[..., None] * f32((0.55, 0.62, 0.85)) * 0.8
    return dict(mat=cv2.GaussianBlur(col, (0, 0), 1.2), sky=sky_grad((0.0, 0.0, 0.02), (0.03, 0.04, 0.10)),
                arc=Arc(1.4 * W), rim_light=0.35, rim_color=(0.6, 0.7, 1.0))


def t_tannery(rng):
    u, v = plane(650)
    S = 235.0
    rv = S * 0.866
    r0 = np.round(v / rv)
    best = np.full(u.shape, 1e9, np.float32)
    bdx, bdy, brr, bcc = [np.zeros_like(best) for _ in range(4)]
    for dr in (-1, 0, 1):
        rr = r0 + dr
        off = np.mod(rr, 2) * S / 2
        cc = np.round((u - off) / S)
        dx, dy = u - (cc * S + off), v - rr * rv
        dist = np.sqrt(dx * dx + dy * dy)
        m = dist < best
        best = np.where(m, dist, best)
        bdx, bdy = np.where(m, dx, bdx), np.where(m, dy, bdy)
        brr, bcc = np.where(m, rr, brr), np.where(m, cc, bcc)
    pal = f32([(0.80, 0.56, 0.18), (0.60, 0.15, 0.09), (0.40, 0.23, 0.12), (0.86, 0.83, 0.76),
               (0.90, 0.70, 0.18), (0.36, 0.44, 0.24), (0.74, 0.36, 0.20), (0.22, 0.27, 0.45),
               (0.80, 0.56, 0.18), (0.60, 0.15, 0.09)])
    idx = (np.abs(brr.astype(np.int64) * 73856093 ^ bcc.astype(np.int64) * 19349663)) % len(pal)
    liquid = pal[idx] * (0.78 + 0.45 * fbm(rng, 50, 4))[..., None]
    rad, ring = 90.0, 20.0
    upper = np.clip(-bdy / (best + 1e-3), 0, 1)
    liquid *= (1 - 0.55 * np.clip((best - 30) / 60, 0, 1) ** 2 * upper)[..., None]
    stone = f32((0.66, 0.58, 0.47)) * (0.72 + 0.5 * fbm(rng, 70, 5))[..., None]
    rn = np.clip((best - rad) / ring, 0, 1)
    rim_shade = 0.78 + 0.35 * (np.cos(rn * np.pi) * 0.5 + 0.5) * (-(bdx * -0.5 + bdy * -0.8) / (best + 1e-3))
    rimc = f32((0.83, 0.77, 0.66)) * rim_shade[..., None]
    col = np.where((best < rad)[..., None], liquid,
                   np.where((best < rad + ring)[..., None], rimc, stone))
    col = cv2.GaussianBlur(col, (0, 0), 0.8)
    haze = (np.clip(1 - (RY - TOP) / 520, 0, 1) ** 2 * 0.35)[..., None]
    col = col * (1 - haze) + f32((0.92, 0.86, 0.78)) * haze
    return dict(mat=col, sky=sky_grad((0.72, 0.78, 0.84), (0.95, 0.90, 0.82)),
                arc=Arc(1.7 * W, rng, (220, 4)))


def t_leaf(rng):
    xm = W * rng.uniform(0.3, 0.7) + 80 * np.sin((RY - TOP) / 380 + rng.uniform(0, 6))
    dxm = RX - xm
    dm = np.abs(dxm)
    midrib = np.exp(-(dm / 10) ** 2)
    sp = 105.0
    ph = (RY + dm * 0.8 + 0.0006 * dm ** 2 * 60 + (dxm > 0) * sp * 0.5) / sp
    fv = ph - np.floor(ph)
    dv = np.minimum(fv, 1 - fv) * sp * 0.62
    vw = 3.6 * np.clip(1 - dm / 800, 0.25, 1)
    sec = np.exp(-(dv / vw) ** 2) * smooth(dm, 8, 20)
    nn = fbm(rng, 45, 3)
    ter = np.exp(-((nn - 0.5) * 55) ** 2)
    hgt = midrib * 12 + sec * 4.5 + ter * 1.4 + fbm(rng, 22, 2) * 2
    n = normals(hgt)
    L = (-0.4, -0.7, 0.6)
    base = ramp(stretch(fbm(rng, 320, 4)), [(0, (0.12, 0.28, 0.06)), (0.5, (0.22, 0.44, 0.10)),
                                            (1, (0.38, 0.58, 0.15))])
    band = np.exp(-((dxm - rng.uniform(150, 300)) / 26) ** 2) * 0.6 * (rng.random() < 0.6)
    col = base * (0.55 + 0.6 * lambert(n, L))[..., None]
    col += (midrib * 0.45 + sec * 0.3 + ter * 0.05)[..., None] * f32((0.55, 0.55, 0.14))
    col += band[..., None] * f32((0.55, 0.45, 0.02))
    col += (specular(n, L, 30) * 0.18)[..., None]
    arc = Arc(1.45 * W)
    serr = 4.5 * np.abs(np.sin(RX / 26 * np.pi))
    arc.d = arc.d - serr
    return dict(mat=col, sky=sky_grad((0.90, 0.88, 0.80), (0.95, 0.92, 0.85)), arc=arc,
                rim_light=0.0, edge_dark=0.35)


def glossy_ball(a, b, rot, body, rng, seed_col=None):
    """A glossy ellipsoid patch: returns rgb, alpha around its centre."""
    s = int(max(a, b) + 3)
    yy, xx = np.mgrid[-s:s + 1, -s:s + 1].astype(np.float32)
    c, sn = math.cos(rot), math.sin(rot)
    lx, ly = xx * c + yy * sn, -xx * sn + yy * c
    rr = (lx / a) ** 2 + (ly / b) ** 2
    nz = np.sqrt(np.clip(1 - rr, 0, 1))
    n = np.dstack([lx / a, ly / b, nz])
    n /= np.linalg.norm(n, axis=2, keepdims=True) + 1e-6
    rgb = ramp(nz, body)
    if seed_col is not None:
        sd = np.exp(-(((lx) / (0.35 * a)) ** 2 + ((ly - 0.25 * b) / (0.5 * b)) ** 2) * 2)
        rgb += sd[..., None] * f32(seed_col) * 0.4
    L = (-0.5, -0.7, 0.6)
    rgb += (specular(n, L, 70) * 1.1 + specular(n, L, 8) * 0.12)[..., None]
    alpha = np.clip((1 - rr) * min(a, b) * 0.9, 0, 1)
    return rgb, alpha


def t_pomegranate(rng):
    R = 1.45 * W
    arc = Arc(R)
    mat = f32((0.18, 0.01, 0.03)) * (0.6 + 0.8 * fbm(rng, 60, 4))[..., None]
    ov, ova = new_layer()
    body = [(0, (0.28, 0.0, 0.04)), (0.5, (0.62, 0.03, 0.12)), (1, (0.88, 0.16, 0.24))]
    pts = []
    for _ in range(9000):
        x, y = rng.uniform(-30, W + 30), rng.uniform(TOP - 60, H + 30)
        a = rng.uniform(27, 38)
        if arc.dist(x, y) > a * 0.4:
            continue
        if all((x - px) ** 2 + (y - py) ** 2 > (a + pa) ** 2 * 0.72 for px, py, pa in pts[-400:]):
            pts.append((x, y, a))
    for x, y, a in pts:
        dc = arc.dist(x, y)
        if abs(x - W / 2) < 280 and dc > -a * 0.2:
            continue
        rgb, al = glossy_ball(a, a * rng.uniform(0.78, 0.95), rng.uniform(0, np.pi), body, rng,
                              (0.95, 0.7, 0.7))
        s = al.shape[0] // 2
        shadow = cv2.GaussianBlur(al, (0, 0), 5) * 0.7
        target = (ov, ova) if dc > -a - 6 else (mat, None)
        paint(target[0], target[1], x - s + 5, y - MT - s + 7, np.zeros_like(rgb), shadow)
        paint(target[0], target[1], x - s, y - MT - s, rgb, al)
    return dict(mat=mat, sky=sky_grad((0.0, 0.0, 0.0), (0.03, 0.01, 0.01)), arc=arc,
                over=(ov, ova), rim_light=0.0)


def bubble(r):
    s = int(r + 4)
    yy, xx = np.mgrid[-s:s + 1, -s:s + 1].astype(np.float32)
    d = np.sqrt(xx * xx + yy * yy)
    ring = np.exp(-((d - r) / 1.5) ** 2)
    inner = np.clip(1 - d / r, 0, 1)
    hl = np.exp(-(((xx + r * 0.4) ** 2 + (yy + r * 0.45) ** 2) / (r * 0.18 + 0.8) ** 2))
    a = np.clip(ring * 0.9 + inner * 0.25 + hl, 0, 1)
    rgb = np.dstack([np.ones_like(d)] * 3) * f32((1.0, 0.93, 0.75))
    rgb = rgb * (0.6 + 0.4 * ring[..., None]) + hl[..., None] * 0.4
    return rgb, a


def t_amber(rng):
    arc = Arc(1.6 * W)
    depth = np.clip(-arc.d, 0, None)
    col = ramp(np.clip(depth / 820, 0, 1), [(0, (1.0, 0.74, 0.22)), (0.08, (0.94, 0.56, 0.08)),
                                           (0.5, (0.62, 0.27, 0.02)), (1, (0.33, 0.11, 0.01))])
    n1 = fbm(rng, 150, 4)
    n2 = fbm(rng, 90, 3)
    caus = np.exp(-np.abs(np.sin(n1 * 34)) * 9) * 0.6 + np.exp(-np.abs(np.sin(n2 * 40)) * 11) * 0.4
    col += caus[..., None] * f32((1.0, 0.82, 0.40)) * 0.32
    specks = cv2.GaussianBlur((rng.random((HR, W)) > 0.9994).astype(np.float32), (0, 0), 1.6) * 6
    col *= (1 - np.clip(specks, 0, 0.8))[..., None]
    ov, ova = new_layer()
    for _ in range(38):
        x = rng.uniform(0, W)
        r = rng.uniform(5, 24)
        if abs(x - W / 2) < 260:
            r = min(r, 9)
        y = arc.cy - arc.R * math.cos(math.asin((x - W / 2) / arc.R)) + r * rng.uniform(-0.2, 0.6)
        rgb, a = bubble(r)
        s = a.shape[0] // 2
        paint(ov, ova, x - s, y - MT - s, rgb, a * 0.9)
    for _ in range(70):
        x, y = rng.uniform(0, W), rng.uniform(TOP + 30, H)
        rgb, a = bubble(rng.uniform(3, 10))
        s = a.shape[0] // 2
        paint(col, None, x - s, y - MT - s, rgb, a * 0.6)
    glow = (np.exp(-np.clip(arc.d, 0, None) / 50) * (arc.d > 0))[..., None] * f32((0.30, 0.16, 0.03))
    return dict(mat=col, sky=sky_grad((0.0, 0.0, 0.0), (0.09, 0.045, 0.01)), arc=arc,
                over=(ov, ova), rim_light=0.6, rim_color=(1.0, 0.9, 0.6), add=glow)


def chalk(rng, canvas_u8, h):
    a = canvas_u8.astype(np.float32) / 255
    rough = 0.55 + 0.6 * noise(rng, 3, h, W)
    return np.clip(a * rough, 0, 1)


def t_blueprint(rng):
    arc = Arc(1.5 * W)
    paper = f32((0.13, 0.30, 0.52)) * (0.9 + 0.2 * fbm(rng, 200, 5))[..., None]
    lines = np.zeros((HR, W), np.uint8)
    cx0, cy0 = int(W / 2 + rng.uniform(-200, 200)), int(TOP - MT + rng.uniform(330, 480))
    for r in (170, 190, 320, 340, 520):
        cv2.ellipse(lines, (cx0, cy0), (r, r), 0, 150, 390, 255, 2, cv2.LINE_AA)
    for sx in (-340, -320, -190, -170, 170, 190, 320, 340):
        y1 = int(cy0 + math.sqrt(max(0, 340 ** 2 - sx ** 2)) * 0.5)
        cv2.line(lines, (cx0 + sx, y1), (cx0 + sx, HR), 255, 2, cv2.LINE_AA)
    for a in np.linspace(math.radians(195), math.radians(345), 9):
        cv2.line(lines, (cx0, cy0), (int(cx0 + 560 * math.cos(a)), int(cy0 + 560 * math.sin(a))), 150, 1, cv2.LINE_AA)
    for y in range(0, HR, 60):
        cv2.line(lines, (0, y), (W, y), 55, 1, cv2.LINE_AA)
    for x in range(0, W, 60):
        cv2.line(lines, (x, 0), (x, HR), 55, 1, cv2.LINE_AA)
    yd = cy0 + 260
    cv2.line(lines, (cx0 - 340, yd), (cx0 + 340, yd), 255, 2, cv2.LINE_AA)
    for x in (cx0 - 340, cx0 + 340):
        cv2.line(lines, (x, yd - 18), (x, yd + 18), 255, 2, cv2.LINE_AA)
    for k in range(4):
        cv2.circle(lines, (int(rng.uniform(80, W - 80)), int(rng.uniform(250, HR - 60))),
                   int(rng.uniform(20, 70)), 200, 2, cv2.LINE_AA)
    for k in range(18):
        x = int(rng.uniform(0, W))
        cv2.line(lines, (x, HR), (x + 140, HR - 140), 120, 1, cv2.LINE_AA)
    col = paper + chalk(rng, lines, HR)[..., None] * f32((0.95, 0.97, 1.0)) * 0.9
    sky = sky_grad((0.16, 0.34, 0.57), (0.16, 0.34, 0.57))
    sl = np.zeros((H, W), np.uint8)
    for k in range(3):
        y0 = int(rng.uniform(80, TOP - 300))
        cv2.line(sl, (-50, y0 + 300), (W + 50, y0 - 200), 255, 2, cv2.LINE_AA)
        for t in np.linspace(0, 1, 26):
            px, py = -50 + t * (W + 100), y0 + 300 - t * 500
            cv2.line(sl, (int(px), int(py)), (int(px + 8), int(py + 16)), 255, 2, cv2.LINE_AA)
    sky += chalk(rng, sl, H)[..., None] * 0.8
    sky *= (0.92 + 0.16 * fbm(rng, 200, 5, h=H))[..., None]
    return dict(mat=col, sky=sky, arc=arc, rim_light=0.85, rim_color=(0.95, 0.97, 1.0), rim_w=2.2)


_fonts = {}


def font(name, size):
    key = (name, size)
    if key not in _fonts:
        _fonts[key] = ImageFont.truetype(str(fonts()[name]), size, layout_engine=ImageFont.Layout.RAQM)
    return _fonts[key]


def t_ledger(rng):
    paper = ramp(fbm(rng, 260, 5), [(0, (0.86, 0.82, 0.72)), (1, (0.96, 0.93, 0.85))])
    fib = noise(rng, 2, HR, W, 40)
    paper *= (0.97 + 0.05 * fib)[..., None]
    ly = np.mod(RY - TOP - 18, 50)
    rule = np.exp(-((np.minimum(ly, 50 - ly)) / 1.0) ** 2) * 0.55
    paper = paper * (1 - rule[..., None]) + f32((0.45, 0.60, 0.80)) * rule[..., None]
    for x, c, wdt in ((W - 150, (0.80, 0.25, 0.25), 1.1), (W - 162, (0.80, 0.25, 0.25), 1.1),
                      (430, (0.55, 0.62, 0.72), 1.0), (250, (0.55, 0.62, 0.72), 1.0)):
        m = np.exp(-((RX - x) / wdt) ** 2) * 0.7
        paper = paper * (1 - m[..., None]) + f32(c) * m[..., None]
    ink = Image.new("RGBA", (W, HR), (0, 0, 0, 0))
    words = ["إيجار", "سلعة", "نقل", "مبيعات", "رواتب", "كهرباء", "زبون", "دَين", "صندوق", "مخزون", "فاتورة"]
    digits = "٠١٢٣٤٥٦٧٨٩"
    fw, fn = font("ruqaa", 40), font("ruqaa", 36)
    y = TOP - MT + 18 + 50 - 6
    while y < HR + 40:
        items = [(W - 190, rng.choice(words), fw, "ra")]
        for x in (410, 230):
            if rng.random() < 0.85:
                num = "".join(rng.choice(list(digits)) for _ in range(int(rng.integers(2, 7))))
                items.append((x, num, fn, "ra"))
        for x, txt, f, anchor in items:
            tile = Image.new("RGBA", (360, 90), (0, 0, 0, 0))
            ImageDraw.Draw(tile).text((340, 62), txt, font=f, fill=(24, 32, 78, 235), anchor="rs",
                                      direction="rtl", language="ar")
            tile = tile.rotate(rng.uniform(-3, 3), resample=Image.BICUBIC)
            ink.paste(tile, (int(x - 340 + rng.uniform(-8, 8)), int(y - 62 + rng.uniform(-3, 3))), tile)
        y += 50
    dr = ImageDraw.Draw(ink)
    for _ in range(3):
        cx, cy = rng.uniform(150, 420), rng.uniform(TOP - MT + 80, HR - 60)
        dr.ellipse((cx - 70, cy - 30, cx + 70, cy + 26), outline=(190, 40, 40, 200), width=3)
    ink = np.asarray(ink).astype(np.float32) / 255
    a = cv2.GaussianBlur(ink[..., 3], (0, 0), 0.6)
    col = paper * (1 - a[..., None]) + ink[..., :3] * a[..., None]
    M = cv2.getRotationMatrix2D((W / 2, TOP - MT), rng.uniform(-4, 4), 1.0)
    col = cv2.warpAffine(col, M, (W, HR), borderMode=cv2.BORDER_REFLECT)
    col *= (1 - 0.25 * np.clip((RY - TOP) / 1000, 0, 1))[..., None]
    return dict(mat=col, sky=sky_grad((0.02, 0.018, 0.015), (0.12, 0.09, 0.06)), arc=Arc(1.6 * W),
                rim_light=0.5, rim_color=(1.0, 0.97, 0.9))


THERMAL = [(0, (0.03, 0.0, 0.12)), (0.22, (0.30, 0.0, 0.50)), (0.42, (0.80, 0.08, 0.45)),
           (0.58, (1.0, 0.42, 0.10)), (0.76, (1.0, 0.82, 0.20)), (0.9, (0.92, 1.0, 0.62)), (1, (1, 1, 1))]


def t_thermal(rng):
    arc = Arc(1.5 * W)
    streak = fbm(rng, 700, 4, h=H, aspect=0.06)
    vs = 0.2 + 0.36 * stretch(streak, 0.28) + 0.3 * np.exp(-np.clip(TOP - Y, 0, None) / 120)
    sky = ramp(np.clip(vs, 0, 1), THERMAL)
    depth = np.clip(-arc.d, 0, None)
    bands = 0.5 + 0.5 * np.sin(depth / 38 + fbm(rng, 260, 3) * 8)
    vm = 0.35 + 0.35 * bands + 0.3 * np.exp(-depth / 110) - 0.2 * np.clip(depth / 900, 0, 1)
    mat = ramp(np.clip(vm, 0, 1), THERMAL)
    return dict(mat=cv2.GaussianBlur(mat, (0, 0), 3), sky=cv2.GaussianBlur(sky, (0, 0), 3),
                arc=arc, rim_light=0.3, rim_color=(1.0, 0.9, 0.6), rim_w=4)


def t_agate(rng):
    arc = Arc(1.35 * W, rng, (140, 3))
    depth = np.clip(-arc.d, 0, None)
    wv = (fbm(rng, 240, 4) - 0.5) * 110 + (fbm(rng, 60, 3) - 0.5) * 10
    b = np.mod(np.sqrt(depth + wv + 120) * 0.55 + (fbm(rng, 90, 2) - 0.5) * 0.25, 1)
    col = ramp(b, [(0, (0.97, 0.90, 0.95)), (0.12, (0.86, 0.45, 0.70)), (0.35, (0.66, 0.10, 0.46)),
                   (0.6, (0.38, 0.04, 0.30)), (0.8, (0.74, 0.20, 0.54)), (0.93, (0.95, 0.80, 0.90)),
                   (1, (0.97, 0.90, 0.95))])
    fine = 0.92 + 0.08 * np.sin(depth * 1.1 + wv * 0.3)
    col *= fine[..., None]
    crystal = np.exp(-depth / 18)
    sparkle = cv2.GaussianBlur((rng.random((HR, W)) > 0.985).astype(np.float32), (0, 0), 1.2) * 3
    col += (crystal * (0.35 + sparkle))[..., None] * f32((1.0, 0.86, 0.55)) * 0.7
    return dict(mat=col, sky=sky_grad((0.46, 0.12, 0.42), (0.62, 0.24, 0.56)), arc=arc,
                rim_light=0.8, rim_color=(1.0, 0.85, 0.5))


def t_mashrabiya(rng):
    """Turned-wood lattice, lit from behind."""
    u, v = plane(1500)
    P, hw, rb = 118.0, 7.0, 15.0
    a, b = (u + v) / 1.414, (u - v) / 1.414
    da = np.abs(a - np.round(a / P) * P)
    db = np.abs(b - np.round(b / P) * P)
    dh = np.abs(v - np.round(v / (P * 0.707)) * P * 0.707)
    dmin = np.minimum(np.minimum(da, db), dh * 1.6)
    bars = np.sqrt(np.clip(1 - (dmin / hw) ** 2, 0, 1)) * hw
    bead = np.sqrt(np.clip(rb * rb - (da * da + db * db), 0, None))
    hgt = np.maximum(bars, bead)
    wood = smooth(hgt, 0.2, 1.2)
    n = normals(hgt)
    grain = fbm(rng, 30, 3, aspect=0.2)
    woodc = f32((0.28, 0.13, 0.05)) * (0.2 + 0.8 * lambert(n, (-0.3, -0.6, 0.8)))[..., None]
    woodc *= (0.75 + 0.5 * grain)[..., None]
    lamp = np.exp(-(((RX - W * rng.uniform(0.35, 0.65)) / 520) ** 2 + ((RY - TOP - 380) / 520) ** 2))
    light = ramp(np.clip(0.35 + 0.65 * lamp + 0.15 * fbm(rng, 300, 3), 0, 1),
                 [(0, (0.40, 0.14, 0.03)), (0.5, (0.95, 0.55, 0.18)), (1, (1.0, 0.93, 0.70))])
    holes = light * (1 - wood[..., None])
    bloom = cv2.GaussianBlur(holes, (0, 0), 10) * 0.6
    col = woodc * wood[..., None] + holes + bloom * wood[..., None]
    return dict(mat=col, sky=sky_grad((0.0, 0.0, 0.0), (0.05, 0.03, 0.01)), arc=Arc(1.5 * W),
                rim_light=0.35, rim_color=(1.0, 0.8, 0.5))


def t_copper(rng):
    """A hammered brass tray with an engraved border."""
    R = 1.3 * W
    arc = Arc(R)
    u, v = plane(1400)
    pts = jitter_grid(rng, 46, u.min() - 60, u.max() + 60, v.min() - 60, v.max() + 60, j=0.4)
    d, _ = voronoi(rng, pts, u, v, k=1)
    hgt = -(d[..., 0] ** 2) / 70 + fbm(rng, 400, 3) * 40
    n = normals(cv2.GaussianBlur(hgt.astype(np.float32), (0, 0), 1.2))
    L = (-0.35, -0.8, 0.5)
    lam = lambert(n, L)
    col = f32((0.42, 0.25, 0.09)) * (0.25 + 0.9 * lam)[..., None]
    col += (specular(n, L, 28) * 1.1 + specular(n, L, 6) * 0.2)[..., None] * f32((1.0, 0.82, 0.50))
    col *= (1 - 0.35 * np.clip((RY - TOP) / 900, 0, 1))[..., None]
    depth = R - arc.r
    k = 8 * np.pi / (2 * math.asin(W / 2 / R))
    grooves = [np.abs(depth - 40), np.abs(depth - 52), np.abs(depth - 168), np.abs(depth - 180),
               np.abs(depth - (100 + 44 * np.abs(np.sin(arc.th * k)))),
               np.abs(depth - (100 + 44 * np.abs(np.sin(arc.th * k + np.pi / 2))))]
    g = np.minimum.reduce(grooves)
    band = (depth > 30) & (depth < 190)
    col = np.where(band[..., None], f32((0.55, 0.36, 0.14)) * (0.8 + 0.3 * lam)[..., None], col)
    cut = np.exp(-(g / 1.6) ** 2) * (depth > 30)
    lip = np.exp(-(np.abs(g - 2.4) / 1.0) ** 2) * (depth > 30)
    col = col * (1 - 0.8 * cut[..., None]) + lip[..., None] * f32((1.0, 0.85, 0.55)) * 0.35
    return dict(mat=col, sky=sky_grad((0.0, 0.0, 0.0), (0.03, 0.02, 0.01)), arc=arc,
                rim_light=0.9, rim_color=(1.0, 0.85, 0.55))


def t_clay(rng):
    u, v = plane(900)
    pts = jitter_grid(rng, 120, u.min() - 200, u.max() + 200, v.min() - 200, v.max() + 200)
    d, i = voronoi(rng, pts, u, v)
    gap = d[..., 1] - d[..., 0]
    wdt = 3.0 + 4.0 * fbm(rng, 150, 3)
    crack = 1 - smooth(gap, wdt * 0.5, wdt)
    hgt = np.clip(gap, 0, 40) * 0.7 + fbm(rng, 18, 3) * 3
    lit = lambert(normals(hgt), (-0.5, -0.8, 0.5))
    cell = rng.uniform(0.9, 1.08, len(pts)).astype(np.float32)[i[..., 0]]
    base = ramp(stretch(fbm(rng, 200, 4)), [(0, (0.66, 0.37, 0.22)), (1, (0.84, 0.60, 0.44))])
    col = base * cell[..., None] * (0.55 + 0.55 * lit)[..., None]
    col = col * (1 - crack[..., None]) + f32((0.16, 0.08, 0.05)) * crack[..., None]
    haze = (np.clip(1 - (RY - TOP) / 450, 0, 1) ** 2 * 0.3)[..., None]
    col = col * (1 - haze) + f32((0.9, 0.86, 0.8)) * haze
    return dict(mat=col, sky=sky_grad((0.78, 0.80, 0.80), (0.92, 0.89, 0.85)),
                arc=Arc(1.6 * W, rng, (200, 5)))


def t_night(rng):
    """The Sahara under stars: dunes by moonlight."""
    sky = sky_grad((0.005, 0.01, 0.03), (0.05, 0.07, 0.16))
    stars = np.zeros((H, W), np.float32)
    n = 1600
    xs, ys = rng.integers(0, W, n), rng.integers(0, TOP, n)
    stars[ys, xs] = (rng.pareto(2.2, n) * 0.25 + 0.05).astype(np.float32)
    stars = cv2.GaussianBlur(stars, (0, 0), 0.8) * 5 + cv2.GaussianBlur(stars, (0, 0), 3) * 3
    band = np.exp(-(((X - Y * 0.6) - 300) / 260) ** 2) * fbm(rng, 120, 5, h=H) * 0.12
    sky += (np.clip(stars, 0, 1.5) * 0.9)[..., None] + band[..., None] * f32((0.7, 0.7, 0.9))
    u, v = plane(900)
    big = fbm(rng, 300, 4)
    ph = (v + u * 0.25 + (fbm(rng, 200, 3) - 0.5) * 120) / 36.0 * 2 * np.pi
    rip = (np.sin(ph) + 0.35 * np.sin(2 * ph + 0.6)) * np.clip((RY - TOP) / 520, 0.08, 1) ** 1.5
    hgt = rip * 2.5 + (big - 0.5) * 200
    lit = lambert(normals(hgt), (0.8, -0.3, 0.45))
    col = ramp(lit, [(0, (0.01, 0.012, 0.03)), (0.5, (0.06, 0.07, 0.14)), (0.85, (0.22, 0.26, 0.42)),
                     (1, (0.40, 0.45, 0.62))])
    col += ((rng.random((HR, W), dtype=np.float32) - 0.5) * 0.03)[..., None]
    return dict(mat=col, sky=sky, arc=Arc(1.7 * W, rng, (320, 18)), rim_light=0.3,
                rim_color=(0.6, 0.7, 1.0))


def t_dandelion(rng):
    """Dandelion clocks: seeds on stalks, each with a fine umbrella."""
    arc = Arc(1.5 * W)
    mat = f32((0.02, 0.02, 0.025)) * (0.6 + 0.8 * fbm(rng, 90, 3))[..., None]
    fib = np.zeros((HR, W), np.uint8)
    for _ in range(3):
        cx, cy = rng.uniform(100, W - 100), H + rng.uniform(80, 300)
        reach = max(cy - TOP, 300)
        for _ in range(650):
            a = -np.pi / 2 + rng.uniform(-1.35, 1.35)
            rr = reach * rng.uniform(0.9, 1.08) if math.sin(a) < -0.5 else rng.uniform(250, reach)
            tx, ty = cx + rr * math.cos(a), cy + rr * math.sin(a)
            if arc.dist(tx, ty) > (4 if abs(tx - W / 2) < 280 else 28):
                continue
            sx, sy = cx + 0.55 * rr * math.cos(a), cy + 0.55 * rr * math.sin(a)
            cv2.line(fib, (int(sx), int(sy - MT)), (int(tx), int(ty - MT)), 70, 1, cv2.LINE_AA)
            for _ in range(16):
                b = a + rng.uniform(-1.1, 1.1)
                ln = rng.uniform(18, 34)
                cv2.line(fib, (int(tx), int(ty - MT)),
                         (int(tx + ln * math.cos(b)), int(ty - MT + ln * math.sin(b))), 150, 1, cv2.LINE_AA)
    fib = cv2.GaussianBlur(fib.astype(np.float32) / 255, (0, 0), 0.5)
    glow = cv2.GaussianBlur(fib, (0, 0), 6) * 0.9
    a = np.clip(fib * 1.3 + glow, 0, 1)
    rgb = np.broadcast_to(f32((0.96, 0.96, 0.93)), (HR, W, 3)).copy()
    return dict(mat=mat, sky=sky_grad((0.0, 0.0, 0.0), (0.02, 0.02, 0.025)), arc=arc,
                over=(rgb, a), rim_light=0.0)


def blob(rng, cx, cy, r, n=48, wobble=0.3, sx=1.0, sy=1.0):
    t = np.linspace(0, 2 * np.pi, n, endpoint=False)
    k = rng.normal(0, 1, (4, 2))
    rr = r * (1 + wobble * sum(k[j, 0] * np.sin((j + 2) * t + k[j, 1]) for j in range(4)) / 2.5)
    return np.stack([cx + rr * np.cos(t) * sx, cy + rr * np.sin(t) * sy], -1).astype(np.int32)


def t_collage(rng):
    arc = Arc(1.45 * W)
    base = f32([(0.13, 0.28, 0.62), (0.08, 0.36, 0.30), (0.80, 0.15, 0.12)][rng.integers(3)])
    col = np.broadcast_to(base, (HR, W, 3)).copy()
    pal = [(0.82, 0.13, 0.10), (0.94, 0.76, 0.27), (0.18, 0.55, 0.38), (0.08, 0.07, 0.07),
           (0.93, 0.65, 0.70), (0.95, 0.92, 0.85), (0.45, 0.22, 0.12), (0.13, 0.28, 0.62)]
    for _ in range(int(rng.integers(8, 12))):
        c = f32(pal[rng.integers(len(pal))])
        if np.allclose(c, base):
            continue
        cx, cy = rng.uniform(0, W), rng.uniform(TOP - MT - 60, HR)
        tall = rng.random() < 0.5
        poly = blob(rng, cx, cy, rng.uniform(90, 230), wobble=0.45,
                    sx=rng.uniform(0.35, 0.6) if tall else 1.0, sy=rng.uniform(1.4, 2.2) if tall else 1.0)
        m = np.zeros((HR, W), np.uint8)
        cv2.fillPoly(m, [poly], 255, cv2.LINE_AA)
        m = m.astype(np.float32) / 255
        sh = cv2.GaussianBlur(np.roll(m, (9, 6), (0, 1)), (0, 0), 7) * 0.45
        col *= (1 - sh[..., None])
        col = col * (1 - m[..., None]) + c * m[..., None]
    col *= (0.96 + 0.08 * noise(rng, 2, HR, W))[..., None]
    sky = sky_grad((0.93, 0.92, 0.88), (0.96, 0.95, 0.91))
    sky *= (0.97 + 0.05 * noise(rng, 2, H, W))[..., None]
    return dict(mat=col, sky=sky, arc=arc, rim_light=0.5, rim_color=(1, 1, 1))


def t_guilloche(rng):
    R = 0.92 * W
    arc = Arc(R)
    th, r = arc.th, arc.r
    depth = R - r
    sheen = (0.5 + 0.5 * np.cos(2 * (th - rng.uniform(-0.3, 0.3)))) ** 3
    brush = 0.9 + 0.1 * np.sin(th * 2600)
    g = 0.5 + 0.5 * np.sin(r / 4.0 + 2.4 * np.sin(th * 110))
    base = f32((0.04, 0.10, 0.27)) * (0.4 + 1.6 * sheen * brush)[..., None]
    base *= (0.82 + 0.3 * g)[..., None]
    col = base.copy()
    track = (depth > 40) & (depth < 120)
    col[track] = col[track] * 0.8
    ang = np.degrees(th)
    tick = np.abs(ang - np.round(ang / 6) * 6) * np.pi / 180 * r
    minute = (np.abs(tick) < 1.6) & (depth > 48) & (depth < 70)
    col[minute] = f32((0.9, 0.92, 0.95))
    hour = (np.abs(np.abs(ang - np.round(ang / 30) * 30) * np.pi / 180 * r) < 9) & (depth > 78) & (depth < 170)
    hn = normals(np.where(hour, 6.0, 0.0).astype(np.float32))
    col[hour] = (f32((0.75, 0.78, 0.82)) * (0.5 + 0.9 * lambert(hn, (-0.3, -0.8, 0.5))[..., None]))[hour]
    bez = depth < 26
    bezel = 0.4 + 0.9 * np.exp(-((depth - 9) / 6) ** 2)
    col[bez] = (f32((0.85, 0.86, 0.88)) * bezel[..., None])[bez]
    return dict(mat=col, sky=sky_grad((0.0, 0.0, 0.0), (0.02, 0.02, 0.03)), arc=arc,
                rim_light=0.6, rim_color=(1, 1, 1))


def t_thinfilm(rng):
    arc = Arc(1.55 * W)
    hgt = fbm(rng, 30, 4) * 6 + fbm(rng, 200, 3) * 20
    lit = lambert(normals(hgt), (-0.4, -0.7, 0.6))
    col = f32((0.10, 0.11, 0.12)) + (lit * 0.18)[..., None] + (fbm(rng, 3, 2) * 0.05)[..., None]
    depth = np.clip(-arc.d, 0, None)
    hue = np.clip(depth / 16 + (fbm(rng, 120, 3) - 0.5) * 0.6, 0, 1)
    hsv = np.dstack([(hue * 300).astype(np.float32), np.full_like(hue, 0.9), np.ones_like(hue)])
    rainbow = cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB)
    band = np.exp(-((depth - 8) / 7) ** 2)
    col = col * (1 - band[..., None] * 0.8) + rainbow * band[..., None] * 0.95
    halo = np.exp(-np.clip(arc.d, 0, None) / 14) * (arc.d > 0)
    add = rainbow * (halo * 0.28)[..., None]
    return dict(mat=col, sky=sky_grad((0.0, 0.0, 0.0), (0.02, 0.02, 0.025)), arc=arc,
                rim_light=0.0, add=add)


def t_ember(rng):
    arc = Arc(1.5 * W, rng, (180, 8))
    pts = jitter_grid(rng, 80, -80, W + 80, MT - 80, H + 80)
    d, _ = voronoi(rng, pts, RX, RY)
    gap = d[..., 1] - d[..., 0]
    heat = 0.5 + 0.8 * fbm(rng, 260, 3)
    crack = np.exp(-(gap / 3.2) ** 2) * heat
    em = ramp(np.clip(crack, 0, 1), [(0, (0, 0, 0)), (0.4, (0.75, 0.16, 0.02)), (0.8, (1.0, 0.52, 0.10)),
                                    (1, (1.0, 0.85, 0.5))])
    lit = lambert(normals(fbm(rng, 25, 4) * 10 + np.clip(gap, 0, 30)), (-0.4, -0.7, 0.6))
    crust = f32((0.07, 0.055, 0.05)) + (lit * 0.12)[..., None]
    col = crust + em
    glow = cv2.GaussianBlur(em, (0, 0), 22) * 0.9
    rimglow = np.exp(-np.clip(arc.d, 0, None) / 60)[..., None] * (arc.d > 0)[..., None] * f32((0.5, 0.12, 0.01))
    return dict(mat=col + glow, sky=sky_grad((0.0, 0.0, 0.0), (0.10, 0.02, 0.005)), arc=arc,
                rim_light=0.35, rim_color=(1.0, 0.5, 0.1), add=rimglow * 0.8)


def t_cells(rng):
    pts = jitter_grid(rng, 52, -60, W + 60, MT - 60, H + 60)
    extra = []
    for _ in range(6):
        bx, by = rng.uniform(0, W), rng.uniform(TOP + 60, H)
        extra.append(np.stack([bx + rng.normal(0, 28, 30), by + rng.normal(0, 28, 30)], -1))
    pts = np.concatenate([pts] + extra).astype(np.float32)
    d, i = voronoi(rng, pts, RX, RY)
    gap = d[..., 1] - d[..., 0]
    wall = np.exp(-(gap / 2.2) ** 2)
    teal = rng.random() < 0.6
    wc = f32((0.08, 0.40, 0.44)) if teal else f32((0.62, 0.12, 0.40))
    inner = f32((0.95, 0.87, 0.86)) * (0.9 + 0.12 * rng.random(len(pts)).astype(np.float32)[i[..., 0]])[..., None]
    inner *= (0.86 + 0.14 * np.clip(d[..., 0] / 26, 0, 1))[..., None]
    small = (i[..., 0] >= len(pts) - 180)
    inner = np.where(small[..., None], wc * 0.6 + 0.35, inner)
    col = inner * (1 - wall[..., None]) + wc * wall[..., None]
    return dict(mat=cv2.GaussianBlur(col, (0, 0), 0.7), sky=sky_grad((0.90, 0.84, 0.84), (0.95, 0.89, 0.88)),
                arc=Arc(1.5 * W), rim_light=0.0, edge_dark=0.4)


def t_water(rng):
    u, v = plane(620)
    wu = u + (fbm(rng, 160, 3) - 0.5) * 140
    wv = v + (fbm(rng, 160, 3) - 0.5) * 140
    pts = jitter_grid(rng, 95, wu.min() - 100, wu.max() + 100, wv.min() - 100, wv.max() + 100)
    d, _ = voronoi(rng, pts, wu, wv)
    gap = d[..., 1] - d[..., 0]
    caus = np.exp(-(gap / 5.5) ** 2)
    depth = np.clip((RY - TOP) / 980, 0, 1)
    col = ramp(depth, [(0, (0.55, 0.86, 0.88)), (0.2, (0.16, 0.62, 0.68)), (1, (0.02, 0.30, 0.42))])
    col += (caus * (0.25 + 0.5 * depth))[..., None] * f32((0.85, 1.0, 0.95)) * 0.6
    n = normals(fbm(rng, 40, 3) * 10)
    col += (specular(n, (0.2, -0.9, 0.4), 120) * 0.8)[..., None]
    return dict(mat=col, sky=sky_grad((0.62, 0.78, 0.86), (0.93, 0.95, 0.94)),
                arc=Arc(1.8 * W), rim_light=0.5, rim_color=(1, 1, 1))


TEXTURES = {
    "sand": t_sand, "zellige": t_zellige, "saffron": t_saffron, "indigo": t_indigo,
    "tannery": t_tannery, "leaf": t_leaf, "pomegranate": t_pomegranate, "amber": t_amber,
    "blueprint": t_blueprint, "ledger": t_ledger, "thermal": t_thermal, "agate": t_agate,
    "mashrabiya": t_mashrabiya, "copper": t_copper, "clay": t_clay, "night": t_night,
    "dandelion": t_dandelion, "collage": t_collage, "guilloche": t_guilloche,
    "thinfilm": t_thinfilm, "ember": t_ember, "cells": t_cells, "water": t_water,
}


def compose(tex):
    for key in ("mat", "sky"):
        tex[key] = np.asarray(tex[key], np.float32)
    arc = tex["arc"]
    d = arc.d
    m = np.clip(0.5 - d / 1.3, 0, 1)[..., None]
    mat = tex["mat"]
    mat = mat * (1 - 0.2 * np.clip(-d / 950, 0, 1))[..., None]
    if tex.get("edge_dark"):
        mat = mat * (1 - tex["edge_dark"] * np.exp(-np.clip(-d, 0, None) / 3))[..., None]
    rl = tex.get("rim_light", 0.2)
    if rl:
        w = tex.get("rim_w", 1.8)
        mat = mat + (rl * np.exp(-((d + w) / w) ** 2))[..., None] * f32(tex.get("rim_color", (1, 1, 1)))
    frame = tex["sky"].copy()
    reg = frame[MT:]
    reg[:] = reg * (1 - m) + mat * m
    if "over" in tex:
        rgb, a = tex["over"]
        reg[:] = reg * (1 - a[..., None]) + rgb * a[..., None]
    if "add" in tex and tex["add"] is not None:
        reg += tex["add"]
    return np.clip(frame, 0, 1)


def text_backdrop_luma(frame):
    box = frame[TOP - 230:TOP - 20, 240:W - 240]
    return float((box @ f32((0.2126, 0.7152, 0.0722))).mean())


# ----------------------------------------------------------- dawn and logo

DAWN = [(-500, (0.010, 0.009, 0.011)), (-40, (0.025, 0.018, 0.018)), (-5, (0.20, 0.07, 0.02)),
        (0, (1.0, 0.64, 0.26)), (9, (0.98, 0.46, 0.10)), (45, (0.66, 0.29, 0.12)),
        (110, (0.42, 0.38, 0.42)), (230, (0.29, 0.44, 0.60)), (440, (0.13, 0.25, 0.39)),
        (820, (0.050, 0.075, 0.115)), (1600, (0.032, 0.040, 0.055))]
NAVY = f32((0.032, 0.040, 0.055))


class Dawn:
    def __init__(self, rng):
        self.streak = 1 + 0.06 * (fbm(rng, 16, 3, h=H, aspect=40) - 0.5)
        self.hz = 0.50 * ((X[0] - W / 2) ** 2) / (4.5 * W)

    def frame(self, p):
        """p=0: dark with a faint glow at the bottom. p=1: the sun's edge."""
        e = p * p * (3 - 2 * p)
        yh = (H + 320) * (1 - e) + (0.60 * H) * e
        d = (yh + self.hz)[None, :] - Y
        pos = [s[0] for s in DAWN]
        cols = np.array([s[1] for s in DAWN], np.float32)
        lut_x = np.arange(-600, 2400, 1, dtype=np.float32)
        lut = np.stack([np.interp(lut_x, pos, cols[:, c]) for c in range(3)], -1).astype(np.float32)
        glow = smooth(p, 0.35, 1.0)
        warm = np.exp(-np.clip(lut_x, 0, None) / 60) * (lut_x > -8)
        lut = lut * (0.55 + 0.45 * glow) - (1 - glow) * warm[:, None] * lut * 0.9
        lut = np.maximum(lut, 0.0)
        img = lut[np.clip(d + 600, 0, len(lut_x) - 1).astype(np.int32)]
        return img * self.streak[..., None]


class Logo:
    WIDTH = 560

    def __init__(self):
        im = np.asarray(Image.open(LOGO).convert("RGBA")).astype(np.float32) / 255
        im = np.pad(im, ((8, 8), (8, 8), (0, 0)))
        a = im[..., 3]
        redness = np.clip((im[..., 0] - im[..., 1]) / 0.6, 0, 1)
        ink, red = a * (1 - redness), a * redness
        ys, xs = np.where(a > 0.05)
        ink = ink[ys.min() - 4:ys.max() + 5, xs.min() - 4:xs.max() + 5]
        red = red[ys.min() - 4:ys.max() + 5, xs.min() - 4:xs.max() + 5]
        s = self.WIDTH / ink.shape[1]
        size = (self.WIDTH, int(round(ink.shape[0] * s)))
        self.ink = cv2.resize(ink, size, interpolation=cv2.INTER_AREA)
        self.red = cv2.resize(red, size, interpolation=cv2.INTER_AREA)
        h, w = self.ink.shape
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        n, lab, stats, _ = cv2.connectedComponentsWithStats((self.ink > 0.35).astype(np.uint8))
        tall = max(stats[i, cv2.CC_STAT_HEIGHT] for i in range(1, n))
        comps = sorted([i for i in range(1, n) if stats[i, cv2.CC_STAT_HEIGHT] > 0.6 * tall],
                       key=lambda i: stats[i, cv2.CC_STAT_LEFT])
        assert len(comps) == 4, "expected the four rings of O U A Q"
        o = stats[comps[0]]
        cy = o[cv2.CC_STAT_TOP] + o[cv2.CC_STAT_HEIGHT] / 2
        self.letters = []
        for k, ci in enumerate(comps):
            st = stats[ci]
            cx = st[cv2.CC_STAT_LEFT] + st[cv2.CC_STAT_WIDTH] / 2
            r = st[cv2.CC_STAT_WIDTH] / 2
            own = cv2.dilate((lab == ci).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
            th = np.mod(np.arctan2(xx - cx, -(yy - cy)), 2 * np.pi)
            stroke = 0.075 * 2 * r
            bar = None
            if k == 2:
                bar = (np.abs(yy - cy) < stroke) & (np.abs(xx - cx) < r - stroke * 1.4)
                own = own | bar
            self.letters.append(dict(own=own, th=th, cx=cx, r=r, bar=bar))
        # Order the red stroke's pixels by distance along it from its top.
        ok = self.red > 0.04
        nr, rlab, rstats, _ = cv2.connectedComponentsWithStats(ok.astype(np.uint8))
        body = 1 + int(np.argmax(rstats[1:, cv2.CC_STAT_AREA]))
        ry, rx = np.where(rlab == body)
        dist = np.full(self.red.shape, -1, np.int32)
        start = np.argmin(ry)
        from collections import deque
        q = deque([(ry[start], rx[start])])
        dist[ry[start], rx[start]] = 0
        while q:
            y, x = q.popleft()
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
                v, u = y + dy, x + dx
                if 0 <= v < h and 0 <= u < w and ok[v, u] and dist[v, u] < 0:
                    dist[v, u] = dist[y, x] + 1
                    q.append((v, u))
        self.red_max = float(dist.max())
        dist[(dist < 0) & (self.red > 0.005)] = int(self.red_max)
        self.red_dist = dist.astype(np.float32)
        self.xx = xx

    def masks(self, t):
        """Ink and red coverage `t` seconds after the draw starts."""
        ink = np.zeros_like(self.ink)
        for k, L in enumerate(self.letters):
            p = ease_io(np.clip((t - k * 0.13) / 0.85, 0, 1))
            sweep = p * 2 * np.pi * 1.02
            m = np.clip((sweep - L["th"]) / 0.09, 0, 1) * L["own"]
            if L["bar"] is not None:
                pb = ease_io(np.clip((t - k * 0.13 - 0.45) / 0.4, 0, 1))
                edge = L["cx"] - L["r"] + pb * 2 * L["r"]
                mb = np.clip((edge - self.xx) / 5, 0, 1)
                m = np.where(L["bar"], mb, m)
            ink = np.maximum(ink, m)
        pr = 1 - (1 - np.clip((t - 0.95) / 0.42, 0, 1)) ** 3
        red = np.clip((pr * self.red_max * 1.05 - self.red_dist) / 4, 0, 1) * (self.red_dist >= 0)
        return self.ink * ink, self.red * red


def ease_io(p):
    return np.where(p < 0.5, 4 * p ** 3, 1 - (-2 * p + 2) ** 3 / 2)


# ------------------------------------------------------------------- words

class Word:
    SIZE = 124

    def __init__(self, txt):
        f = font("naskh", self.SIZE)
        img = Image.new("L", (W, 420), 0)
        ImageDraw.Draw(img).text((W / 2, 300), txt, font=f, fill=255, anchor="ms",
                                 direction="rtl", language="ar")
        a = np.asarray(img).astype(np.float32) / 255
        yy, xx = np.mgrid[0:420, 0:W].astype(np.float32)
        sag = TEXT_R - np.sqrt(TEXT_R ** 2 - (xx - W / 2) ** 2)
        self.alpha = cv2.remap(a, xx, yy - sag, cv2.INTER_LINEAR)
        self.y0 = TOP - 28 - 300    # baseline sits just above the crest

    def draw(self, frame, age, color):
        a = self.alpha
        k = np.clip(age / 6, 0, 1)
        if k < 1:
            a = cv2.GaussianBlur(a, (0, 0), 0.3 + 5 * (1 - k))
        off = int(round(14 * (1 - k) ** 2))
        y0 = self.y0 + off
        reg = frame[y0:y0 + a.shape[0]]
        dark_text = color is INK
        sh = cv2.GaussianBlur(a, (0, 0), 9) * (0.28 if dark_text else 0.45) * k
        shc = f32((1, 1, 1)) if dark_text else f32((0, 0, 0))
        reg[:] = reg * (1 - sh[..., None]) + shc * sh[..., None]
        a = a * k
        reg[:] = reg * (1 - a[..., None]) + f32(color) * a[..., None]


# ------------------------------------------------------------------- sound

SR = 48000


def synth(cuts, marks, total):
    """The soundtrack: a clock ticking on every cut over a slow pad, a
    ratchet into the change, a drop, then silence and the logo's chord."""
    n = int(total * SR)
    out = np.zeros((2, n), np.float32)
    rng = np.random.default_rng(7)
    t_all = np.arange(n) / SR

    def at(t):
        return int(t * SR)

    def add(sig, t0, gain=1.0, pan=0.0):
        i = at(t0)
        if i >= n:
            return
        sig = sig[:n - i] * gain
        out[0, i:i + len(sig)] += sig * math.sqrt((1 - pan) / 2)
        out[1, i:i + len(sig)] += sig * math.sqrt((1 + pan) / 2)

    def pad(freqs, dur, bright):
        m = int(dur * SR)
        t = np.arange(m) / SR
        s = np.zeros(m, np.float32)
        for f in freqs:
            for det in (-0.004, 0.0, 0.0045):
                ff = f * (1 + det)
                vib = 1 + 0.0015 * np.sin(2 * np.pi * 0.21 * t + rng.uniform(0, 6))
                for k in range(1, 16):
                    if ff * k > 9000:
                        break
                    amp = (1 / k) * math.exp(-k / bright)
                    s += (amp * np.sin(2 * np.pi * ff * k * t * vib + rng.uniform(0, 6))).astype(np.float32)
        return s / np.abs(s).max()

    def env(m, points):
        tp = [p[0] for p in points]
        vp = [p[1] for p in points]
        return np.interp(np.arange(m) / SR, tp, vp).astype(np.float32)

    def tick(freq):
        m = int(0.08 * SR)
        t = np.arange(m) / SR
        click = rng.normal(0, 1, m) * np.exp(-t / 0.0012)
        click = np.diff(click, prepend=0)
        tone = np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.007)
        body = np.sin(2 * np.pi * freq * 0.5 * t) * np.exp(-t / 0.012) * 0.4
        return (click * 0.25 + tone * 0.8 + body).astype(np.float32)

    def mallet(f, length=2.2):
        m = int(length * SR)
        t = np.arange(m) / SR
        s = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.7)
        s += 0.35 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t / 0.06)
        s += 0.15 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.35)
        return (s * np.minimum(1, t / 0.003)).astype(np.float32)

    def bell(f, length=4.5):
        m = int(length * SR)
        t = np.arange(m) / SR
        idx = 3.2 * np.exp(-t / 0.5)
        s = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 3.5 * t)) * np.exp(-t / 1.8)
        return (s * np.minimum(1, t / 0.002)).astype(np.float32)

    t_dark, t_logo, t_sun = marks["dark"], marks["logo"], marks["sun"]
    t_strobe0, t_strobe1 = marks["strobe"]

    # Pad in D, suspended until the logo resolves it.
    sus = [73.42, 110.0, 164.81, 220.0, 293.66]
    dur = t_dark
    p1 = pad(sus, dur + 0.1, 3.0)
    p2 = pad([f * 2 for f in sus[2:]], dur + 0.1, 5.0)
    m = len(p1)
    e1 = env(m, [(0, 0), (2.5, 0.8), (t_strobe0, 0.9), (t_strobe1, 1.05), (dur - 0.02, 1.25), (dur, 0.0), (dur + 0.1, 0)])
    e2 = env(m, [(0, 0), (t_strobe0 - 1, 0.0), (t_strobe1, 0.5), (dur - 0.02, 0.9), (dur, 0.0), (dur + 0.1, 0)])
    add(p1 * e1, 0, 0.16)
    add(p2 * e2, 0, 0.07)

    for k, tc in enumerate(cuts):
        add(tick(2300 if k % 2 == 0 else 1700), tc, 0.14, pan=0.25 if k % 2 else -0.25)

    # A ratchet through the strobe and a riser into the change.
    nr = int((t_strobe1 - t_strobe0 + 1.0) * SR)
    noise_ = rng.normal(0, 1, nr).astype(np.float32)
    f, tt, Z = signal.stft(noise_, SR, nperseg=1024)
    prog = np.clip(tt / tt[-1], 0, 1)
    fc = 600 * (12 ** prog)
    Z *= np.exp(-((np.log(f[:, None] + 1) - np.log(fc[None, :])) / 0.45) ** 2)
    _, riser = signal.istft(Z, SR, nperseg=1024)
    riser = riser[:nr] / (np.abs(riser).max() + 1e-6)
    riser *= np.linspace(0, 1, len(riser)) ** 2
    add(riser.astype(np.float32), t_strobe0 - 1.0, 0.16)
    for k in range(STROBE):
        add(tick(2600 + 90 * k), t_strobe0 + k / FPS, 0.12, pan=math.sin(k))

    m = int(1.4 * SR)
    t = np.arange(m) / SR
    f_inst = 42 + 70 * np.exp(-t / 0.08)
    boom = np.sin(2 * np.pi * np.cumsum(f_inst) / SR) * np.exp(-t / 0.45)
    thud = signal.sosfilt(signal.butter(2, 900, "low", fs=SR, output="sos"), rng.normal(0, 1, m)) * np.exp(-t / 0.08)
    add((boom * 0.9 + thud * 0.6).astype(np.float32), t_strobe1, 0.5)

    # The logo: a note per letter as it draws, a bell on the red stroke.
    for k, f in enumerate((587.33, 739.99, 880.0, 1174.66)):
        add(mallet(f), t_logo + k * 0.13 + 0.05, 0.09, pan=-0.45 + 0.3 * k)
    add(bell(1318.5), t_logo + 1.0, 0.045, pan=0.2)
    add(bell(1760.0), t_logo + 1.02, 0.03, pan=-0.2)

    maj = [146.83, 220.0, 293.66, 369.99, 440.0, 659.25]
    rest = total - t_logo
    p3 = pad(maj, rest, 4.0)
    m = len(p3)
    e3 = env(m, [(0, 0), (1.0, 0.35), (t_sun - t_logo, 0.5), (t_sun - t_logo + 3.0, 1.0),
                 (rest - 1.2, 0.95), (rest, 0.0)])
    add(p3 * e3, t_logo + 0.9, 0.24)
    p4 = pad([587.33, 880.0, 1174.66], rest, 6.0)
    e4 = env(len(p4), [(0, 0), (t_sun - t_logo, 0.0), (t_sun - t_logo + 3.0, 0.6), (rest - 1.2, 0.5), (rest, 0)])
    add(p4 * e4, t_logo + 0.9, 0.09)

    # Room: a short synthetic hall on everything.
    ir_len = int(2.4 * SR)
    ti = np.arange(ir_len) / SR
    wet = np.zeros_like(out)
    lp = signal.butter(2, 5000, "low", fs=SR, output="sos")
    for c in range(2):
        ir = signal.sosfilt(lp, rng.normal(0, 1, ir_len)) * np.exp(-ti / 0.75)
        ir /= np.sqrt((ir ** 2).sum())
        wet[c] = signal.fftconvolve(out[c], ir)[:n]
    mix = out + wet * 0.35
    mix = signal.sosfilt(signal.butter(2, 28, "high", fs=SR, output="sos"), mix, axis=1)
    mix /= np.abs(mix).max() + 1e-9
    mix = np.tanh(mix * 1.4) / np.tanh(1.4) * 0.89
    fade = np.minimum(1, np.minimum(t_all / 0.05, (total - t_all) / 0.6)).clip(0, 1)
    return (mix * fade).astype(np.float32)


def write_wav(path, stereo):
    pcm = (np.clip(stereo.T, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


# ------------------------------------------------------------------ fonts

def fonts():
    want = {
        "naskh": ("@fontsource/noto-naskh-arabic", "noto-naskh-arabic-arabic-500-normal"),
        "ruqaa": ("@fontsource/aref-ruqaa", "aref-ruqaa-arabic-400-normal"),
    }
    paths = {}
    CACHE.mkdir(exist_ok=True)
    for key, (pkg, stem) in want.items():
        ttf = CACHE / f"{stem}.ttf"
        if not ttf.exists():
            from fontTools.ttLib import TTFont
            with tempfile.TemporaryDirectory() as tmp:
                tgz = subprocess.run(["npm", "pack", "--silent", pkg], cwd=tmp, check=True,
                                     capture_output=True, text=True).stdout.strip().splitlines()[-1]
                with tarfile.open(Path(tmp) / tgz) as tar:
                    member = tar.getmember(f"package/files/{stem}.woff2")
                    tar.extract(member, tmp)
                f = TTFont(Path(tmp) / member.name)
                f.flavor = None
                f.save(ttf)
        paths[key] = ttf
    return paths


def ffmpeg_bin():
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


# ------------------------------------------------------------------ render

def render(out, only=None):
    rng = np.random.default_rng(2026)
    segs = timeline()
    words = [Word(w) for w in WORDS]
    dawn = Dawn(rng)
    logo = Logo()
    assert sum(1 for s in segs if s[0] == "clip") == len(ORDER)

    # The plan: (kind, first frame, frames, word, index of the cut or strobe).
    plan, cut_times, word_first = [], [], {}
    f0 = ci = si = 0
    for kind, n, word in segs:
        idx = None
        if kind == "clip":
            idx, ci = ci, ci + 1
            cut_times.append(f0 / FPS)
            word_first.setdefault(word, f0)
        elif kind == "strobe":
            idx, si = si, si + 1
        plan.append((kind, f0, n, word, idx))
        f0 += n
    total_frames = f0
    strobes = [p for p in plan if p[0] == "strobe"]
    end0 = plan[-1][1]
    marks = dict(strobe=(strobes[0][1] / FPS, (strobes[-1][1] + 1) / FPS), dark=end0 / FPS,
                 logo=(end0 + DARK_TO_LOGO) / FPS, sun=(end0 + LOGO_HOLD) / FPS)

    stills, lumas = {}, {}

    def still(i):
        if i not in stills:
            fr = compose(TEXTURES[ORDER[i]](np.random.default_rng(1000 + i)))
            lumas[i] = text_backdrop_luma(fr)
            stills[i] = (fr * 255 + 0.5).astype(np.uint8)
            print(f"  texture {i + 1:2d}/{len(ORDER)} {ORDER[i]}", file=sys.stderr)
        return stills[i]

    # The strobe flashes stills from the first half, never two alike in a row.
    strobe_pick = np.random.default_rng(99).permutation(20)[:STROBE]

    grain = [cv2.resize(rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32), (W, H),
                        interpolation=cv2.INTER_LINEAR) for _ in range(12)]
    vig = (1 - 0.2 * (((X - W / 2) / (W / 2)) ** 2 * 0.6 + ((Y - H / 2) / (H / 2)) ** 2 * 0.4))[..., None]

    def frame_at(fi):
        kind, s0, n, word, idx = next(p for p in plan if p[1] <= fi < p[1] + p[2])
        k = fi - s0
        if kind == "dawn":
            return dawn.frame(1.0)
        if kind == "strobe":
            img = still(int(strobe_pick[idx])).astype(np.float32) / 255
            if idx % 3 == 0:
                img = 1 - img
            elif idx % 3 == 1:
                img = img[..., [2, 0, 1]]
            return img
        if kind == "clip":
            t = k / FPS
            s = 1 + 0.03 * t
            dx = (6 if idx % 2 else -6) * t
            M = np.float32([[s, 0, (1 - s) * W / 2 + dx], [0, s, (1 - s) * TOP]])
            img = cv2.warpAffine(still(idx), M, (W, H), flags=cv2.INTER_LINEAR,
                                 borderMode=cv2.BORDER_REFLECT).astype(np.float32) / 255
            if word is not None:
                color = INK if lumas[idx] > 0.5 else IVORY
                words[word].draw(img, fi - word_first[word], color)
            return img
        # The end: dark, the logo draws itself, the sun comes up behind it.
        p = float(np.clip((k - LOGO_HOLD) / SUNRISE, 0, 1))
        img = dawn.frame(p)
        tl = (k - DARK_TO_LOGO) / FPS
        if tl > 0:
            ink, red = logo.masks(tl)
            e = float(ease_io(np.array(p)))
            cy = H * (0.47 * (1 - e) + 0.34 * e)
            sc = 1 + 0.015 * min(1.0, tl / 3)
            h, w = ink.shape
            M = np.float32([[sc, 0, W / 2 - sc * w / 2], [0, sc, cy - sc * h / 2]])
            a_ink = cv2.warpAffine(ink, M, (W, H))
            a_red = cv2.warpAffine(red, M, (W, H))
            bloom = cv2.GaussianBlur(a_ink + a_red, (0, 0), 14) * 0.18
            img = img + bloom[..., None] * f32((1.0, 0.95, 0.9))
            img = img * (1 - a_ink[..., None]) + f32(IVORY) * a_ink[..., None]
            img = img * (1 - a_red[..., None]) + f32(RED) * a_red[..., None]
        return img

    def finish(img, fi):
        img = img * vig * 0.975 + 0.012
        img = img + grain[(fi * 7) % len(grain)][..., None] * 0.014
        return (np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)

    if only is not None:
        out.parent.mkdir(parents=True, exist_ok=True)
        for fi in sorted(only):
            Image.fromarray(finish(frame_at(fi), fi)).save(out.parent / f"{out.stem}_{fi:04d}.png")
        return

    tmp = Path(tempfile.mkdtemp())
    video, audio = tmp / "video.mp4", tmp / "audio.wav"
    total = total_frames / FPS
    write_wav(audio, synth(cut_times, marks, total))
    ff = ffmpeg_bin()
    proc = subprocess.Popen([ff, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                             "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                             "-vf", "scale=out_color_matrix=bt709:out_range=tv",
                             "-c:v", "libx264", "-preset", "slow", "-crf", "22", "-pix_fmt", "yuv420p",
                             "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
                             str(video)], stdin=subprocess.PIPE)
    for fi in range(total_frames):
        proc.stdin.write(finish(frame_at(fi), fi).tobytes())
        if fi % 60 == 0:
            print(f"  frame {fi}/{total_frames}", file=sys.stderr)
    proc.stdin.close()
    if proc.wait():
        sys.exit("ffmpeg failed")
    out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([ff, "-y", "-loglevel", "error", "-i", str(video), "-i", str(audio), "-c:v", "copy",
                    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", str(out)], check=True)
    shutil.rmtree(tmp)
    print(f"wrote {out} ({total:.1f}s)", file=sys.stderr)


def sheet(out):
    names = list(TEXTURES)
    cols = 6
    tw, th = W // 4, H // 4
    rows = (len(names) + cols - 1) // cols
    img = Image.new("RGB", (cols * tw, rows * th))
    w = Word(WORDS[1])
    for i, name in enumerate(names):
        fr = compose(TEXTURES[name](np.random.default_rng(1000 + i)))
        w.draw(fr, 99, INK if text_backdrop_luma(fr) > 0.5 else IVORY)
        small = cv2.resize((fr * 255).astype(np.uint8), (tw, th), interpolation=cv2.INTER_AREA)
        img.paste(Image.fromarray(small), ((i % cols) * tw, (i // cols) * th))
        print(f"  {name}", file=sys.stderr)
    img.save(out)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", type=Path, default=OUT)
    ap.add_argument("--sheet", type=Path, help="write one still per texture to this PNG and stop")
    ap.add_argument("--frames", help="comma-separated frame numbers to write as PNGs next to --out")
    args = ap.parse_args()
    if args.sheet:
        sheet(args.sheet)
    elif args.frames:
        render(args.out, [int(f) for f in args.frames.split(",")])
    else:
        render(args.out)
