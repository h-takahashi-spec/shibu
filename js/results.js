/* ============================================================
 * 結果ページ（results.html?rel=all|friend|lover|spouse|parent）
 * ============================================================ */
(function () {
  var R = window.RR, U = R.U, API = R.API, CFG = R.CFG, ART = window.RR_ART;
  var LKEYS = R.LABELS.map(function (l) { return l.id; });
  var N = R.RELATIONS.length;
  var TABS = N > 1 ? [['all', '全体']].concat(R.RELATIONS.map(function (r) { return [r.id, r.name]; })) : [];
  var PAGE = 8;

  var S = {
    tab: U.qs('rel') || 'all', rows: [], all: [], pw: '', teacher: false, loaded: false,
    filt: { yes: '', no: '' }, open: { yes: PAGE, no: PAGE }
  };
  if (N === 1) S.tab = R.RELATIONS[0].id;
  else if (!TABS.some(function (t) { return t[0] === S.tab; })) S.tab = 'all';
  try { S.pw = sessionStorage.getItem('rr_pw') || ''; } catch (e) { }

  U.$('siteTitle').textContent = R.SURVEY.title;
  document.title = 'みんなの結果｜' + R.SURVEY.title;
  U.fixLinks();
  U.$('tLink').setAttribute('href', U.url('results.html', { t: 1 }));
  if (API.demo) { U.$('demoBanner').classList.remove('hidden'); U.$('resetBtn').classList.remove('hidden'); }
  if (U.qs('t') === '1' || S.pw) U.$('teacherPanel').classList.remove('hidden');

  var me = U.pid(), done = U.store.get(U.key('rr_done'), null);

  function toast(msg) {
    var t = U.$('toast'); t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.add('hidden'); }, 2600);
  }

  /* ---------- データ ---------- */
  // 同じ人（同じ端末）が出し直したときは、いちばん新しい提出だけを使う
  function latest(rows) {
    var last = {};
    rows.forEach(function (r) { var k = r.pid || r.sid; if (!last[k] || String(r.ts) > String(last[k].ts)) last[k] = r; });
    var keep = {}; Object.keys(last).forEach(function (k) { keep[last[k].sid] = 1; });
    return rows.filter(function (r) { return keep[r.sid]; });
  }
  function load() {
    return API.list(S.teacher ? S.pw : '').then(function (res) {
      S.all = res.rows || [];
      S.rows = latest(S.all);
      S.loaded = true;
      render();
    }).catch(function (e) {
      if (!S.loaded) U.$('view').innerHTML = '<div class="panel">データを読み込めませんでした（' + U.esc(e.message) + '）。少し待って「いますぐ更新」を押してください。</div>';
    });
  }
  function visible(rows) { return rows.filter(function (r) { return S.teacher || !r.hidden; }); }
  function people(rows) { var o = {}; rows.forEach(function (r) { o[r.sid] = 1; }); return Object.keys(o).length; }

  function countLabels(rows) {
    var c = {}, n = 0; LKEYS.forEach(function (k) { c[k] = 0; });
    rows.forEach(function (r) { var l = U.effLabel(r); if (c[l] != null) { c[l]++; n++; } });
    return { c: c, n: n, pending: rows.length - n };
  }

  /* ---------- 部品 ---------- */
  function labBadge(r) {
    var l = U.effLabel(r);
    if (!l) return '<span class="lab pending">分類待ち</span>';
    return '<span class="lab" style="background:' + R.LAB[l].color + '">' + R.LAB[l].name + '</span>' +
      (r.teacherLabel ? ' <span class="small muted">（先生が修正）</span>' : '') +
      String(r.aiSecondary || '').split(',').filter(function (k) { return R.LAB[k] && k !== l; }).map(function (k) {
        return ' <span class="lab sub" style="color:' + R.LAB[k].color + '">' + R.LAB[k].name + '</span>';
      }).join('');
  }
  function stackBar(cl) {
    if (!cl.n) return '<div class="stack"></div>';
    return '<div class="stack" role="img" aria-label="分類の割合">' + LKEYS.filter(function (k) { return cl.c[k]; }).map(function (k) {
      return '<div title="' + R.LAB[k].name + ' ' + U.pct(cl.c[k], cl.n) + '%" style="width:' + (cl.c[k] / cl.n * 100) + '%;background:' + R.LAB[k].color + '"></div>';
    }).join('') + '</div>';
  }
  function legend() {
    return '<div class="legend">' + R.LABELS.map(function (l) {
      return '<span title="' + U.esc(l.desc) + '"><i class="labdot" style="background:' + l.color + '"></i>' + l.name + '</span>';
    }).join('') +
      '<details class="small muted"><summary>それぞれの分類の意味</summary>' + R.LABELS.map(function (l) {
        return '<div><b style="color:' + l.color + '">' + l.name + '</b>：' + l.desc + '</div>';
      }).join('') + '<div style="margin-top:4px">AIが理由の主な考え方を1つ選び、ほかにも含まれている考え方があれば白いバッジで添えています。</div></details></div>';
  }
  function card(r) {
    var mine = r.pid === me;
    var tools = '';
    if (S.teacher) {
      tools = '<div class="tools">分類を直す：<select data-relabel="' + U.esc(r.id) + '"><option value="">（AIのまま）</option>' +
        R.LABELS.map(function (l) { return '<option value="' + l.id + '"' + (r.teacherLabel === l.id ? ' selected' : '') + '>' + l.name + '</option>'; }).join('') + '</select>' +
        '<button class="btn ghost" style="padding:0 10px;font-size:13px" data-hide="' + U.esc(r.id) + '" data-v="' + (r.hidden ? '' : '1') + '">' + (r.hidden ? '公開に戻す' : '学生から隠す') + '</button></div>';
    }
    return '<div class="rcard' + (mine ? ' mine' : '') + (r.hidden ? ' hid' : '') + '">' +
      '<div class="who"><b>' + U.esc(r.nickname) + '</b>' + (mine ? '（あなた）' : '') + ' ' + labBadge(r) + (r.hidden ? ' <span class="small">［非公開］</span>' : '') + '</div>' +
      '<p class="txt">' + U.esc(r.reason) + '</p>' +
      (r.aiComment ? '<div class="aicomment"><b>AIのコメント</b><br>' + U.esc(r.aiComment) + '</div>' : '') + tools + '</div>';
  }

  /* ---------- 全体 ---------- */
  function overview() {
    var rows = visible(S.rows), n = people(rows);
    if (!n) return '<div class="panel">まだ回答がありません。</div>';

    var rel = R.RELATIONS.map(function (rel) {
      var rr = rows.filter(function (r) { return r.relation === rel.id; });
      var y = rr.filter(function (r) { return r.answer === 'yes'; }).length;
      var mine = rr.filter(function (r) { return r.pid === me; })[0];
      return '<a class="relcard" href="' + U.url('results.html', { rel: rel.id }) + '" style="border-top:8px solid ' + rel.color + '">' +
        '<div class="nm">' + rel.name + '</div><div class="big">' + U.pct(y, rr.length) + '<small>% が「はい」</small></div>' +
        '<div class="minibar"><i style="width:' + U.pct(y, rr.length) + '%"></i></div>' +
        '<div class="small muted" style="margin-top:4px">はい ' + y + '人／いいえ ' + (rr.length - y) + '人' + (mine ? '<br>あなた：<b>' + (mine.answer === 'yes' ? 'はい' : 'いいえ') + '</b>' : '') + '</div></a>';
    }).join('');

    // 関係 × はい／いいえ ごとの分類の割合
    var heat = '<div class="scroll-x"><table class="heat"><thead><tr><th></th>' + R.LABELS.map(function (l) {
      return '<th style="color:' + l.color + '">' + l.name + '</th>';
    }).join('') + '<th class="muted">件数</th></tr></thead><tbody>';
    R.RELATIONS.forEach(function (rel) {
      ['yes', 'no'].forEach(function (ans) {
        var rr = rows.filter(function (r) { return r.relation === rel.id && r.answer === ans; }), cl = countLabels(rr);
        heat += '<tr><th>' + rel.name + ' <span class="ans ' + ans + '">' + (ans === 'yes' ? 'はい' : 'いいえ') + '</span></th>' +
          LKEYS.map(function (k) {
            var p = cl.n ? cl.c[k] / cl.n : 0;
            return '<td style="background:' + mix(R.LAB[k].color, p) + ';color:' + (p > 0.45 ? '#fff' : '#2b2622') + '">' + (cl.n ? Math.round(p * 100) + '%' : '–') + '</td>';
          }).join('') + '<td class="muted">' + cl.n + (cl.pending ? '<span class="small">＋' + cl.pending + '</span>' : '') + '</td></tr>';
      });
    });
    heat += '</tbody></table></div>';

    // はい派・いいえ派で、理由の分類がどう違うか（4つの関係を合わせて）
    var sides = ['yes', 'no'].map(function (ans) {
      var cl = countLabels(rows.filter(function (r) { return r.answer === ans; }));
      return '<div class="side ' + ans + '"><h3>「' + (ans === 'yes' ? 'はい' : 'いいえ') + '」の理由</h3><div class="small muted">4つの関係を合わせて ' + cl.n + ' 件</div>' + stackBar(cl) +
        '<div class="labrows">' + LKEYS.filter(function (k) { return cl.c[k]; }).sort(function (a, b) { return cl.c[b] - cl.c[a]; }).map(function (k) {
          return '<div class="labrow" style="cursor:default"><span><i class="labdot" style="background:' + R.LAB[k].color + '"></i>' + R.LAB[k].name + '</span><span class="bar"><i style="width:' + U.pct(cl.c[k], cl.n) + '%;background:' + R.LAB[k].color + '"></i></span><span class="n">' + U.pct(cl.c[k], cl.n) + '%</span></div>';
        }).join('') + '</div></div>';
    }).join('');

    // 4問の答え方のパターン
    var pat = {};
    var bySid = {};
    rows.forEach(function (r) { (bySid[r.sid] = bySid[r.sid] || {})[r.relation] = r.answer; });
    Object.keys(bySid).forEach(function (sid) {
      var k = R.RELATIONS.map(function (rel) { return bySid[sid][rel.id] === 'yes' ? 'Y' : bySid[sid][rel.id] === 'no' ? 'N' : '-'; }).join('');
      if (k.indexOf('-') < 0) pat[k] = (pat[k] || 0) + 1;
    });
    var myKey = (function () {
      var m = rows.filter(function (r) { return r.pid === me; }); if (m.length < 4) return '';
      return R.RELATIONS.map(function (rel) { var x = m.filter(function (r) { return r.relation === rel.id; })[0]; return x && x.answer === 'yes' ? 'Y' : 'N'; }).join('');
    })();
    var keys = Object.keys(pat).sort(function (a, b) { return pat[b] - pat[a]; }).slice(0, 6);
    var total = Object.keys(bySid).length;
    var pats = keys.map(function (k) {
      return '<div class="pattern"><div class="dots">' + k.split('').map(function (c, i) {
        return '<span title="' + R.RELATIONS[i].name + '" style="background:' + (c === 'Y' ? 'var(--yes)' : 'var(--no)') + '">' + R.RELATIONS[i].name.charAt(0) + '</span>';
      }).join('') + '</div><div class="minibar" style="margin:0"><i style="width:' + U.pct(pat[k], total) + '%"></i></div><b style="text-align:right">' + pat[k] + '人</b></div>' +
        (k === myKey ? '<div class="small" style="margin:-2px 0 6px">↑ あなたと同じ答え方</div>' : '');
    }).join('');

    return '<div class="panel"><span class="kicker">' + n + ' 人が回答</span><h2 class="title-m" style="margin-top:10px">「はい（代わりになる）」と答えた人の割合</h2>' +
      '<div class="grid4" style="margin-top:12px">' + rel + '</div></div>' +
      '<div class="panel"><h2 class="title-m">「はい」派と「いいえ」派で、理由の考え方はちがう？</h2>' + legend() + '<div class="grid2" style="margin-top:14px">' + sides + '</div></div>' +
      '<div class="panel"><h2 class="title-m">関係ごとに見た、理由の分類の割合</h2><p class="small muted">各行の中での割合です。行をくらべると、同じ「いいえ」でも関係によって理由のタイプが変わるかがわかります。</p>' + heat + '</div>' +
      '<div class="panel"><h2 class="title-m">4問の答え方のパターン</h2><p class="small muted">色つきの四角は左から 友・恋・配・親。青が「はい」、オレンジが「いいえ」です（多い順に6つまで）。</p>' + pats + '</div>';
  }
  function mix(hex, p) {
    var c = parseInt(hex.slice(1), 16), r = c >> 16, g = (c >> 8) & 255, b = c & 255, w = 0.1 + 0.9 * Math.min(1, p * 1.25);
    if (!p) return '#f6f2ea';
    return 'rgb(' + Math.round(255 + (r - 255) * w) + ',' + Math.round(255 + (g - 255) * w) + ',' + Math.round(255 + (b - 255) * w) + ')';
  }

  /* ---------- 関係ごと ---------- */
  function relation(id) {
    var rel = R.REL[id], rows = visible(S.rows).filter(function (r) { return r.relation === id; });
    var y = rows.filter(function (r) { return r.answer === 'yes'; }), nn = rows.filter(function (r) { return r.answer === 'no'; });
    var py = U.pct(y.length, rows.length);
    var mine = rows.filter(function (r) { return r.pid === me; })[0];

    function side(ans, list) {
      var cl = countLabels(list), f = S.filt[ans];
      var shown = f ? list.filter(function (r) { return U.effLabel(r) === f; }) : list.slice();
      shown.sort(function (a, b) { return (b.pid === me) - (a.pid === me) || String(b.ts).localeCompare(String(a.ts)); });
      var lim = S.open[ans];
      return '<div class="side ' + ans + '"><h3>「' + (ans === 'yes' ? 'はい' : 'いいえ') + '」と答えた人の理由</h3>' +
        '<div class="small muted">' + list.length + ' 人' + (cl.pending ? '（うち ' + cl.pending + ' 件は分類待ち）' : '') + '</div>' + stackBar(cl) +
        '<div class="labrows">' + LKEYS.filter(function (k) { return cl.c[k]; }).sort(function (a, b) { return cl.c[b] - cl.c[a]; }).map(function (k) {
          return '<button class="labrow' + (f === k ? ' on' : '') + '" data-filt="' + ans + ':' + k + '" aria-pressed="' + (f === k) + '"><span><i class="labdot" style="background:' + R.LAB[k].color + '"></i>' + R.LAB[k].name + '</span><span class="bar"><i style="width:' + U.pct(cl.c[k], cl.n) + '%;background:' + R.LAB[k].color + '"></i></span><span class="n">' + U.pct(cl.c[k], cl.n) + '%</span></button>';
        }).join('') + '</div>' +
        '<p class="small muted" style="margin:8px 0 0">' + (f ? '「' + R.LAB[f].name + '」の理由だけを表示中（' + shown.length + '件）　<a href="#" data-filt="' + ans + ':">すべて表示</a>' : '分類の行を押すと、その理由だけにしぼれます。') + '</p>' +
        '<div class="cards">' + (shown.length ? shown.slice(0, lim).map(card).join('') : '<p class="muted small">まだありません。</p>') + '</div>' +
        (shown.length > lim ? '<div class="more"><button class="btn ghost" data-more="' + ans + '">もっと見る（あと ' + (shown.length - lim) + ' 件）</button></div>' : '') + '</div>';
    }

    return '<div class="panel"><span class="kicker" style="background:' + rel.color + '">' + rel.name + '</span>' +
      (rel.preface ? '<blockquote class="preface">' + U.esc(rel.preface) + '</blockquote>' : '') +
      '<h2 class="title-m" style="margin-top:10px">' + U.esc(rel.q) + '</h2>' +
      (rows.length ? '<div class="bigsplit"><div class="y" style="flex-basis:' + py + '%">' + (py >= 12 ? 'はい ' + py + '%' : '') + '</div><div class="n" style="flex-basis:' + (100 - py) + '%">' + (100 - py >= 12 ? 'いいえ ' + (100 - py) + '%' : '') + '</div></div>' +
        '<div class="splitlegend"><span>はい（' + rel.yesSub + '）' + y.length + '人</span><span>いいえ（' + rel.noSub + '）' + nn.length + '人</span></div>' : '<p>まだ回答がありません。</p>') +
      (mine ? '<p class="small" style="margin:8px 0 0">あなたの答え：<span class="ans ' + mine.answer + '">' + (mine.answer === 'yes' ? 'はい' : 'いいえ') + '</span>（黄色のカードがあなたの理由です）</p>' : '') +
      '<div style="margin-top:12px">' + legend() + '</div></div>' +
      '<div class="grid2">' + side('yes', y) + side('no', nn) + '</div>';
  }

  /* ---------- 描画 ---------- */
  function tabs() {
    U.$('tabs').innerHTML = TABS.map(function (t) {
      var rel = R.REL[t[0]];
      return '<a class="tab' + (t[0] === S.tab ? ' on' : '') + '" href="' + U.url('results.html', { rel: t[0] }) + '"' + (t[0] === S.tab && rel ? ' style="background:' + rel.color + ';border-color:' + rel.color + '"' : '') + '>' + t[1] + '</a>';
    }).join('');
  }
  function render() {
    if (gated()) return;
    tabs();
    var y = window.scrollY;
    U.$('view').innerHTML = S.tab === 'all' ? overview() : relation(S.tab);
    window.scrollTo(0, y);
  }

  function gated() {
    if (!CFG.RESULTS_GATE || done || S.teacher) return false;
    U.$('tabs').innerHTML = '';
    U.$('view').innerHTML = '<div class="panel" style="max-width:640px;margin:0 auto"><div class="art">' + ART.scene('lock') + '</div>' +
      '<h2 class="title-m">結果は、回答してから見られます</h2><p>まずは質問に答えて提出してください。提出したこの端末（ブラウザ）で、みんなの結果が見られるようになります。</p>' +
      '<div class="row end"><a class="btn primary" href="' + U.url('index.html') + '" style="text-decoration:none">回答ページへ</a></div></div>';
    return true;
  }

  /* ---------- 操作 ---------- */
  U.$('view').addEventListener('click', function (e) {
    var t = e.target.closest('[data-filt],[data-more],[data-hide]');
    if (!t) return;
    e.preventDefault();
    if (t.dataset.filt != null) {
      var p = t.dataset.filt.split(':');
      S.filt[p[0]] = S.filt[p[0]] === p[1] ? '' : p[1]; S.open[p[0]] = PAGE; render();
    } else if (t.dataset.more) {
      S.open[t.dataset.more] += 20; render();
    } else if (t.dataset.hide) {
      API.hide(S.pw, t.dataset.hide, !!t.dataset.v).then(function () { toast(t.dataset.v ? '学生の画面から隠しました' : '公開に戻しました'); load(); })
        .catch(function (err) { toast(err.message); });
    }
  });
  U.$('view').addEventListener('change', function (e) {
    var t = e.target; if (!t.dataset.relabel) return;
    API.relabel(S.pw, t.dataset.relabel, t.value).then(function () { toast('分類を直しました'); load(); }).catch(function (err) { toast(err.message); });
  });

  // 先生モード
  function setTeacher(on) {
    S.teacher = on;
    U.$('tLogin').classList.toggle('hidden', on);
    U.$('tTools').classList.toggle('hidden', !on);
    if (on) U.$('teacherPanel').classList.remove('hidden');
  }
  U.$('pwBtn').onclick = function () {
    var pw = U.$('pw').value;
    API.login(pw).then(function () {
      S.pw = pw; try { sessionStorage.setItem('rr_pw', pw); } catch (e) { }
      setTeacher(true); U.$('tMsg').textContent = ''; load();
    }).catch(function (e) { U.$('tMsg').textContent = e.message; });
  };
  U.$('pw').onkeydown = function (e) { if (e.key === 'Enter') U.$('pwBtn').click(); };
  U.$('logoutBtn').onclick = function () {
    S.pw = ''; try { sessionStorage.removeItem('rr_pw'); } catch (e) { }
    setTeacher(false); load();
  };
  U.$('classifyBtn').onclick = function () {
    var btn = this, total = 0; btn.disabled = true;
    (function step() {
      U.$('tMsg').innerHTML = '<span class="spinner"></span>分類中…（ここまで ' + total + ' 件）';
      API.classifyAll(S.pw, 12).then(function (res) {
        total += res.done;
        if (res.errors && res.errors.length) U.$('tMsg').textContent = 'エラー：' + res.errors[0];
        if (res.remaining > 0 && res.done > 0) return step();
        btn.disabled = false;
        if (!(res.errors && res.errors.length)) U.$('tMsg').textContent = total + ' 件を分類しました。' + (res.remaining ? '（残り ' + res.remaining + ' 件）' : '未分類はありません。');
        load();
      }).catch(function (e) { btn.disabled = false; U.$('tMsg').textContent = 'エラー：' + e.message; });
    })();
  };
  U.$('csvBtn').onclick = function () {
    var cols = ['ts', 'survey', 'nickname', 'pid', 'sid', 'relation', 'answer', 'reason', 'aiPrimary', 'aiSecondary', 'aiComment', 'teacherLabel', 'hidden', 'latest'];
    var keep = {}; S.rows.forEach(function (r) { keep[r.id] = 1; });
    var lines = [cols.join(',')].concat(S.all.map(function (r) {
      return cols.map(function (c) {
        var v = c === 'latest' ? (keep[r.id] ? 1 : 0) : c === 'relation' ? (R.REL[r.relation] || {}).name || r.relation : c === 'answer' ? (r.answer === 'yes' ? 'はい' : 'いいえ') : (c === 'aiPrimary' || c === 'teacherLabel') && R.LAB[r[c]] ? R.LAB[r[c]].name : r[c];
        return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
      }).join(',');
    }));
    var blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'robot-relations_' + R.SURVEY.id + '_' + new Date().toISOString().slice(0, 10) + '.csv'; a.click();
  };
  U.$('resetBtn').onclick = function () { if (confirm('デモデータを初期化しますか？')) { R.Demo.reset(); load(); } };
  U.$('reload').onclick = function () { load(); };

  // 起動
  (S.pw ? API.login(S.pw).then(function () { setTeacher(true); }).catch(function () { S.pw = ''; }) : Promise.resolve()).then(function () {
    if (!gated()) load();
  });
  var sec = CFG.AUTO_REFRESH_SEC || 0;
  if (sec) setInterval(function () {
    if (U.$('auto').checked && !document.hidden && !(document.activeElement && document.activeElement.tagName === 'SELECT') && !gated()) load();
  }, sec * 1000);
})();
