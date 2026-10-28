/* ============================================================
 * イラスト（すべてSVG・オリジナル）
 * ============================================================ */
(function () {
  var INK = '#2b2622';

  function svg(inner, w, h) {
    return '<svg viewBox="0 0 ' + (w || 400) + ' ' + (h || 240) + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">' + inner + '</svg>';
  }

  // ロボット（ころんとした箱型・アンテナ・まるい目）
  function robot(o) {
    o = Object.assign({ x: 0, y: 0, s: 1, color: '#9fd3d0', expr: 'smile', wave: false, apron: false }, o);
    var eye = o.expr === 'happy'
      ? '<path d="M-20 -46 q6 -8 12 0" stroke="' + INK + '" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M8 -46 q6 -8 12 0" stroke="' + INK + '" stroke-width="4" fill="none" stroke-linecap="round"/>'
      : '<circle cx="-14" cy="-46" r="6.5" fill="' + INK + '"/><circle cx="14" cy="-46" r="6.5" fill="' + INK + '"/><circle cx="-12" cy="-48" r="2" fill="#fff"/><circle cx="16" cy="-48" r="2" fill="#fff"/>';
    var arm = o.wave
      ? '<path d="M30 6 q22 -10 26 -36" stroke="' + INK + '" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="56" cy="-34" r="8" fill="' + o.color + '" stroke="' + INK + '" stroke-width="3"/>'
      : '<path d="M30 6 q14 10 16 28" stroke="' + INK + '" stroke-width="7" fill="none" stroke-linecap="round"/>';
    return '<g transform="translate(' + o.x + ' ' + o.y + ') scale(' + o.s + ')">' +
      '<ellipse cx="0" cy="62" rx="40" ry="7" fill="' + INK + '" opacity=".12"/>' +
      '<line x1="0" y1="-84" x2="0" y2="-100" stroke="' + INK + '" stroke-width="4"/><circle cx="0" cy="-104" r="7" fill="#ffd166" stroke="' + INK + '" stroke-width="3"/>' +
      '<path d="M-30 6 q-14 10 -16 28" stroke="' + INK + '" stroke-width="7" fill="none" stroke-linecap="round"/>' + arm +
      '<rect x="-30" y="-6" width="60" height="62" rx="18" fill="' + o.color + '" stroke="' + INK + '" stroke-width="3.5"/>' +
      (o.apron ? '<path d="M-20 4 h40 v40 q-20 10 -40 0z" fill="#fff" stroke="' + INK + '" stroke-width="3"/><circle cx="0" cy="22" r="5" fill="#ffb3c1"/>' : '<circle cx="0" cy="22" r="9" fill="#fff" stroke="' + INK + '" stroke-width="3"/><circle cx="0" cy="22" r="3.5" fill="#ff8fa3"/>') +
      '<rect x="-44" y="-84" width="88" height="70" rx="26" fill="' + o.color + '" stroke="' + INK + '" stroke-width="3.5"/>' +
      '<rect x="-34" y="-74" width="68" height="50" rx="18" fill="#f7fbfb" stroke="' + INK + '" stroke-width="2.5"/>' +
      eye +
      '<ellipse cx="-24" cy="-34" rx="6" ry="3.5" fill="#ff9fb2" opacity=".75"/><ellipse cx="24" cy="-34" rx="6" ry="3.5" fill="#ff9fb2" opacity=".75"/>' +
      '<path d="M-7 -33 q7 7 14 0" stroke="' + INK + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '</g>';
  }

  // 人（シンプルなシルエット）
  function person(o) {
    o = Object.assign({ x: 0, y: 0, s: 1, color: '#f4a261', hair: INK, flip: false, small: false }, o);
    var sc = o.s * (o.small ? 0.68 : 1);
    return '<g transform="translate(' + o.x + ' ' + o.y + ') scale(' + (o.flip ? -sc : sc) + ' ' + sc + ')">' +
      '<ellipse cx="0" cy="62" rx="30" ry="6" fill="' + INK + '" opacity=".12"/>' +
      '<path d="M-28 60 v-30 q0 -26 28 -26 q28 0 28 26 v30z" fill="' + o.color + '" stroke="' + INK + '" stroke-width="3.5"/>' +
      '<circle cx="0" cy="-30" r="28" fill="#ffe2c8" stroke="' + INK + '" stroke-width="3.5"/>' +
      '<path d="M-28 -32 q2 -30 28 -28 q26 -2 28 28 q-14 -16 -30 -12 q-12 4 -26 12z" fill="' + o.hair + '"/>' +
      '<circle cx="-9" cy="-28" r="3.5" fill="' + INK + '"/><circle cx="9" cy="-28" r="3.5" fill="' + INK + '"/>' +
      '<path d="M-6 -16 q6 5 12 0" stroke="' + INK + '" stroke-width="2.8" fill="none" stroke-linecap="round"/>' +
      '</g>';
  }

  function heart(x, y, s, c) {
    return '<path transform="translate(' + x + ' ' + y + ') scale(' + (s || 1) + ')" d="M0 8 C-16 -6 -10 -20 0 -12 C10 -20 16 -6 0 8z" fill="' + (c || '#ff6b8b') + '" stroke="' + INK + '" stroke-width="2.5"/>';
  }
  function bubble(x, y, w, h, txt, fs) {
    return '<g transform="translate(' + x + ' ' + y + ')"><rect width="' + w + '" height="' + h + '" rx="14" fill="#fff" stroke="' + INK + '" stroke-width="3"/>' +
      '<path d="M18 ' + h + ' l4 12 l10 -12" fill="#fff" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/><rect x="16" y="' + (h - 3) + '" width="18" height="5" fill="#fff"/>' +
      '<text x="' + (w / 2) + '" y="' + (h / 2 + (fs || 16) * 0.36) + '" text-anchor="middle" font-size="' + (fs || 16) + '" font-family="Zen Maru Gothic, sans-serif" font-weight="700" fill="' + INK + '">' + txt + '</text></g>';
  }
  function bg(c1, c2) {
    return '<rect width="400" height="240" fill="' + c1 + '"/><path d="M0 196 Q200 176 400 196 V240 H0z" fill="' + c2 + '"/>';
  }
  function sparkle(x, y, c) {
    return '<path transform="translate(' + x + ' ' + y + ')" d="M0 -9 L2.5 -2.5 L9 0 L2.5 2.5 L0 9 L-2.5 2.5 L-9 0 L-2.5 -2.5z" fill="' + (c || '#ffd166') + '"/>';
  }

  var SCENES = {
    hero: function () {
      return svg(bg('#fff4dc', '#ffe3b0') +
        sparkle(60, 50) + sparkle(345, 60, '#ff9fb2') + sparkle(320, 160, '#9fd3d0') +
        robot({ x: 200, y: 140, s: 1.05, expr: 'happy', wave: true }) +
        bubble(28, 70, 92, 40, '友達？', 17) + bubble(290, 26, 92, 40, '恋人？', 17) +
        bubble(18, 140, 104, 40, '配偶者？', 17) + bubble(282, 104, 80, 40, '親？', 17));
    },
    friend: function (c) {
      return svg(bg('#fff1e3', '#fde0c4') +
        person({ x: 128, y: 140, color: '#7fb7e6', hair: '#5a3d2b' }) +
        robot({ x: 272, y: 140, color: '#9fd3d0', wave: true }) +
        bubble(160, 18, 84, 40, 'あはは', 16) + sparkle(64, 48) + sparkle(352, 70, '#ff9fb2'));
    },
    lover: function () {
      return svg(bg('#fdeaf0', '#f9cfdc') +
        person({ x: 132, y: 142, color: '#f28fad', hair: INK }) +
        robot({ x: 270, y: 142, color: '#c8b6ef', expr: 'happy' }) +
        heart(200, 60, 1.6) + heart(168, 34, 0.8, '#ffb3c1') + heart(236, 30, 0.9, '#ffb3c1'));
    },
    spouse: function () {
      return svg(bg('#efeafb', '#ddd2f5') +
        '<path d="M310 196 v-62 l38 -30 l38 30 v62z" fill="#fff" stroke="' + INK + '" stroke-width="3"/><rect x="338" y="160" width="20" height="36" fill="#ffd166" stroke="' + INK + '" stroke-width="2.5"/>' +
        person({ x: 110, y: 142, color: '#8ac6a0', hair: '#3b2a20' }) +
        robot({ x: 220, y: 142, color: '#bfe3d9', apron: true }) +
        '<circle cx="164" cy="56" r="13" fill="none" stroke="#e0b400" stroke-width="5"/><circle cx="182" cy="56" r="13" fill="none" stroke="#c9a400" stroke-width="5"/>' + sparkle(173, 34));
    },
    parent: function () {
      return svg(bg('#e3f4f1', '#c6e8e2') +
        robot({ x: 170, y: 136, s: 1.15, color: '#a9d8ee', expr: 'happy' }) +
        person({ x: 268, y: 174, small: true, color: '#ffcf5c', hair: '#4a2f22' }) +
        '<path d="M222 160 q20 -6 32 6" stroke="' + INK + '" stroke-width="6" fill="none" stroke-linecap="round"/>' +
        heart(300, 70, 1.1, '#ffb3c1') + sparkle(70, 60) + sparkle(330, 120, '#ffd166'));
    },
    done: function () {
      return svg(bg('#fff4dc', '#ffe3b0') +
        robot({ x: 200, y: 140, expr: 'happy', wave: true, color: '#9fd3d0' }) +
        sparkle(90, 60) + sparkle(310, 50, '#ff9fb2') + sparkle(330, 140, '#9fd3d0') + sparkle(70, 150, '#c8b6ef') +
        bubble(250, 30, 120, 40, 'ありがとう！', 15));
    },
    tada: function () {
      // 夜のベンチに並んで座る、人とロボット
      var stars = [[40, 30], [90, 60], [150, 24], [250, 40], [300, 20], [370, 56], [200, 70], [120, 96]].map(function (p, i) {
        return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i % 3 ? 1.6 : 2.4) + '" fill="#fff6c7"/>';
      }).join('');
      return svg('<rect width="400" height="240" fill="#2f3561"/><rect y="120" width="400" height="120" fill="#3a4072"/>' + stars +
        '<circle cx="330" cy="70" r="26" fill="#fff1b8"/><circle cx="342" cy="62" r="24" fill="#2f3561"/>' +
        '<path d="M0 200 Q200 186 400 200 V240 H0z" fill="#262b4f"/>' +
        '<rect x="96" y="176" width="210" height="12" rx="4" fill="#a8774f" stroke="' + INK + '" stroke-width="3"/>' +
        '<rect x="110" y="188" width="8" height="22" fill="#7d5636"/><rect x="284" y="188" width="8" height="22" fill="#7d5636"/>' +
        person({ x: 158, y: 126, s: 0.9, color: '#f4a261', hair: INK }) +
        robot({ x: 248, y: 130, s: 0.82, color: '#9fd3d0', expr: 'happy' }) +
        '<path d="M190 168 q14 6 28 0" stroke="#fff6c7" stroke-width="3" fill="none" stroke-dasharray="3 5" stroke-linecap="round"/>');
    },
    lock: function () {
      return svg(bg('#f3efe8', '#e6dfd3') +
        robot({ x: 200, y: 140, color: '#d9d4cc' }) +
        '<g transform="translate(270 70)"><rect x="-22" y="0" width="44" height="36" rx="8" fill="#ffd166" stroke="' + INK + '" stroke-width="3"/><path d="M-12 0 v-10 a12 12 0 0 1 24 0 v10" fill="none" stroke="' + INK + '" stroke-width="4"/></g>');
    }
  };

  window.RR_ART = { scene: function (k) { return (SCENES[k] || SCENES.hero)(); }, robot: robot };
})();
