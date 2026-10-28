/* ============================================================
 * 回答ページ（index.html）
 * ============================================================ */
(function () {
  var R = window.RR, U = R.U, API = R.API, CFG = R.CFG, ART = window.RR_ART;
  var app = U.$('app');
  var MIN = CFG.MIN_REASON || 15, MAX = CFG.MAX_REASON || 400;
  var SV = R.SURVEY, QS = R.RELATIONS, N = QS.length;
  var DRAFT = U.key('rr_draft_v1'), DONE = U.key('rr_done');

  U.$('siteTitle').textContent = SV.title;
  U.$('course').textContent = CFG.COURSE ? CFG.COURSE + '｜アンケート' : 'アンケート';
  document.title = SV.title;
  U.fixLinks();
  if (API.demo) U.$('demoBanner').classList.remove('hidden');
  function pre(t) { return t ? '<blockquote class="preface">' + U.esc(t) + '</blockquote>' : ''; }

  var S = U.store.get(DRAFT, null) || { nickname: '', step: 0, answers: {} };
  function save() { U.store.set(DRAFT, S); }
  function show(html) { app.innerHTML = html; window.scrollTo(0, 0); }

  /* ---------- 0. はじめ ---------- */
  function intro() {
    var done = U.store.get(DONE, null);
    show('<div class="panel">' +
      '<div class="art">' + ART.scene(SV.hero) + '</div>' +
      '<span class="kicker">' + SV.kicker + '</span>' +
      '<h1 class="title-l">' + SV.heading + '</h1>' + pre(SV.preface) +
      '<p class="lead">' + SV.lead + '</p>' +
      '<p class="small muted">' + (N > 1 ? N + 'つすべてに' : '') + '答えて提出すると、みんなの結果を見られるようになります。書いた理由は、AIが考え方のタイプ（合理的・感情的・機能的…）に分けてコメントをつけ、<b>ニックネームとともにクラスの人に公開</b>されます。ほかの人が読んで困ることは書かないでください。</p>' +
      (done ? '<div class="aicomment"><b>回答済みです</b><br>「' + U.esc(done.nickname) + '」として提出しました。<a href="' + U.url('results.html') + '">みんなの結果を見る</a>／もう一度答えると、新しい回答で上書きされます。</div>' : '') +
      '<label class="field" for="nick">ニックネーム（結果ページに表示されます）</label>' +
      '<input type="text" id="nick" maxlength="20" autocomplete="off" placeholder="例：たこやき" value="' + U.esc(S.nickname || (done && done.nickname) || '') + '">' +
      '<div class="err" id="err"></div>' +
      '<div class="row end"><button class="btn primary" id="go">' + (S.step > 0 && S.step <= N ? 'つづきから答える' : 'はじめる') + '</button></div>' +
      '</div>');
    var nick = U.$('nick');
    U.$('go').onclick = function () {
      var v = nick.value.trim();
      if (!v) { U.$('err').textContent = 'ニックネームを入れてください。'; nick.focus(); return; }
      S.nickname = v.slice(0, 20);
      if (!(S.step >= 1 && S.step <= N + 1)) S.step = 1;
      save(); route();
    };
    nick.onkeydown = function (e) { if (e.key === 'Enter') U.$('go').click(); };
  }

  /* ---------- 1〜4. 質問 ---------- */
  function question(i) {
    var rel = R.RELATIONS[i], a = S.answers[rel.id] || { answer: '', reason: '' };
    var steps = R.RELATIONS.map(function (_, k) { return '<span class="' + (k < i ? 'done' : k === i ? 'on' : '') + '"></span>'; }).join('');
    show('<div class="panel">' +
      (N > 1 ? '<div class="steps" aria-label="' + (i + 1) + ' / ' + N + ' 問目">' + steps + '</div>' : '') +
      '<div class="art">' + ART.scene(rel.scene) + '</div>' +
      '<span class="qtag" style="background:' + rel.soft + '">' + (N > 1 ? 'Q' + (i + 1) + '／' + N + '　' : '') + rel.name + '</span>' +
      pre(rel.preface) +
      '<h2 class="title-l" style="font-size:clamp(20px,4.8vw,26px)">' + U.esc(rel.q) + '</h2>' +
      '<div class="yn" role="group" aria-label="はい または いいえ">' +
      '<button class="yes" id="bYes" aria-pressed="' + (a.answer === 'yes') + '">はい<small>' + rel.yesSub + '</small></button>' +
      '<button class="no" id="bNo" aria-pressed="' + (a.answer === 'no') + '">いいえ<small>' + rel.noSub + '</small></button></div>' +
      '<label class="field" for="reason">そう考えた理由</label>' +
      '<textarea id="reason" maxlength="' + MAX + '" placeholder="' + (a.answer ? '' : 'まず「はい」か「いいえ」を選んでください') + '">' + U.esc(a.reason) + '</textarea>' +
      '<div class="counter" id="cnt"></div>' +
      '<div class="err" id="err"></div>' +
      '<div class="row between"><button class="btn ghost" id="back">もどる</button><button class="btn primary" id="next">' + (i === N - 1 ? '確認へ' : '次へ') + '</button></div>' +
      '</div>');

    var ta = U.$('reason');
    function ph() {
      ta.placeholder = a.answer ? '「' + (a.answer === 'yes' ? rel.yesSub : rel.noSub) + '」と考えるのはなぜ？（' + MIN + '文字以上）' : 'まず「はい」か「いいえ」を選んでください';
    }
    function cnt() {
      var n = ta.value.trim().length, c = U.$('cnt');
      c.textContent = n + ' 文字' + (n < MIN ? '（あと ' + (MIN - n) + ' 文字）' : '');
      c.className = 'counter' + (n >= MIN ? ' ok' : '');
    }
    function pick(v) {
      a.answer = v; S.answers[rel.id] = a; save();
      U.$('bYes').setAttribute('aria-pressed', v === 'yes'); U.$('bNo').setAttribute('aria-pressed', v === 'no');
      ph(); U.$('err').textContent = ''; ta.focus();
    }
    U.$('bYes').onclick = function () { pick('yes'); };
    U.$('bNo').onclick = function () { pick('no'); };
    ta.oninput = function () { a.reason = ta.value; S.answers[rel.id] = a; save(); cnt(); };
    ph(); cnt();

    U.$('back').onclick = function () { S.step = i === 0 ? 0 : i; save(); route(); };
    U.$('next').onclick = function () {
      if (!a.answer) { U.$('err').textContent = '「はい」か「いいえ」を選んでください。'; return; }
      if (ta.value.trim().length < MIN) { U.$('err').textContent = '理由を ' + MIN + ' 文字以上で書いてください。'; ta.focus(); return; }
      S.answers[rel.id] = { answer: a.answer, reason: ta.value.trim().slice(0, MAX) };
      S.step = S.review ? N + 1 : i + 2; save(); route();
    };
  }

  /* ---------- 5. 確認 ---------- */
  function review() {
    S.review = true; save();
    var items = R.RELATIONS.map(function (rel, i) {
      var a = S.answers[rel.id] || {};
      return '<div class="item"><div class="head"><span>' + (N > 1 ? 'Q' + (i + 1) + '　' : '') + rel.name + '</span>' +
        '<span><span class="ans ' + a.answer + '">' + (a.answer === 'yes' ? 'はい' : 'いいえ') + '</span> <button class="btn ghost" data-edit="' + i + '" style="padding:0 10px;font-size:13px">直す</button></span></div>' +
        '<div class="reason">' + U.esc(a.reason) + '</div></div>';
    }).join('');
    show('<div class="panel"><span class="kicker">確認</span><h2 class="title-m" style="margin-top:10px">この内容で提出しますか？</h2>' +
      '<p class="small muted">ニックネーム「<b>' + U.esc(S.nickname) + '</b>」で、理由といっしょに公開されます。</p>' +
      '<div class="review">' + items + '</div><div class="err" id="err"></div>' +
      '<div class="row between"><button class="btn ghost" id="nickEdit">ニックネームを変える</button><button class="btn primary" id="submit">提出する</button></div></div>');
    app.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { S.step = +b.dataset.edit + 1; save(); route(); }; });
    U.$('nickEdit').onclick = function () { S.step = N + 1; save(); intro(); };
    U.$('submit').onclick = submit;
  }

  function complete() {
    return R.RELATIONS.every(function (rel) { var a = S.answers[rel.id]; return a && a.answer && String(a.reason || '').trim().length >= MIN; });
  }

  /* ---------- 送信 ---------- */
  function submit() {
    var btn = U.$('submit'); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>送信中…';
    var payload = {
      pid: U.pid(), nickname: S.nickname, ua: navigator.userAgent.slice(0, 200),
      answers: R.RELATIONS.map(function (rel) { return { relation: rel.id, answer: S.answers[rel.id].answer, reason: S.answers[rel.id].reason }; })
    };
    API.submit(payload).then(function (res) {
      U.store.set(DONE, { sid: res.sid, nickname: S.nickname, at: new Date().toISOString() });
      var answers = payload.answers;
      U.store.del(DRAFT); S = { nickname: S.nickname, step: 0, answers: {} };
      done(res.sid, answers);
    }).catch(function (e) {
      btn.disabled = false; btn.textContent = '提出する';
      U.$('err').textContent = '送信できませんでした（' + e.message + '）。もう一度押してください。';
    });
  }

  /* ---------- 6. 完了：自分の理由の分類を見せる ---------- */
  function done(sid, answers) {
    function cards(rows) {
      return R.RELATIONS.map(function (rel, i) {
        var a = answers[i], r = (rows || []).filter(function (x) { return x.relation === rel.id; })[0] || {};
        var lab = U.effLabel(r);
        var badge = lab ? '<span class="lab" style="background:' + R.LAB[lab].color + '">' + R.LAB[lab].name + '</span>' + subBadges(r)
          : '<span class="lab pending">' + (rows ? '分類待ち' : '<span class="spinner" style="width:12px;height:12px;border-width:2px"></span>分類中') + '</span>';
        return '<div class="item"><div class="head"><span>' + (N > 1 ? 'Q' + (i + 1) + '　' : '') + rel.name + '　<span class="ans ' + a.answer + '">' + (a.answer === 'yes' ? 'はい' : 'いいえ') + '</span></span><span>' + badge + '</span></div>' +
          '<div class="reason">' + U.esc(a.reason) + '</div>' +
          (r.aiComment ? '<div class="aicomment"><b>AIのコメント</b><br>' + U.esc(r.aiComment) + '</div>' : '') + '</div>';
      }).join('');
    }
    function render(rows, note) {
      show('<div class="panel"><div class="art">' + ART.scene('done') + '</div>' +
        '<span class="kicker">提出しました</span><h2 class="title-l">おつかれさまでした！</h2>' +
        '<p>あなたの理由は、AIからはこう見えました。' + (note || '') + '</p>' +
        '<div class="review">' + cards(rows) + '</div>' +
        '<div class="legend small muted" style="margin-bottom:14px">' + R.LABELS.filter(function (l) { return l.id !== 'unclear'; }).map(function (l) {
          return '<span><i class="labdot" style="background:' + l.color + '"></i><b>' + l.name + '</b>：' + l.desc + '</span>';
        }).join('') + '</div>' +
        '<div class="row end"><a class="btn primary" href="' + U.url('results.html') + '" style="text-decoration:none">みんなの結果を見る</a></div></div>');
    }
    render(null);
    if (!CFG.AUTO_CLASSIFY) { render([], 'AIの分類は、先生があとでまとめて行います。'); return; }
    API.classifyMine(sid, U.pid()).then(function (res) {
      render(res.rows || [], (res.rows || []).some(function (r) { return !r.aiPrimary; }) ? '（いくつかは分類が混み合っているので、あとで結果ページに反映されます）' : '');
    }).catch(function () {
      render([], '（AIが混み合っているので、分類はあとで結果ページに反映されます）');
    });
  }

  function subBadges(r) {
    return String(r.aiSecondary || '').split(',').filter(function (k) { return R.LAB[k] && k !== U.effLabel(r); }).map(function (k) {
      return ' <span class="lab sub" style="color:' + R.LAB[k].color + '">' + R.LAB[k].name + '</span>';
    }).join('');
  }

  function route() {
    if (!S.nickname || !S.step) return intro();
    if (S.step >= 1 && S.step <= N) {
      // 前の質問が終わっていないなら戻す
      for (var k = 0; k < S.step - 1; k++) {
        var a = S.answers[R.RELATIONS[k].id];
        if (!a || !a.answer || String(a.reason || '').trim().length < MIN) { S.step = k + 1; break; }
      }
      return question(S.step - 1);
    }
    if (S.step === N + 1 && complete()) return review();
    S.step = 1; return question(0);
  }

  // URL ?reset=1 で下書きと「回答済み」を消す（授業前の動作確認用）
  if (U.qs('reset') === '1') { U.store.del(DRAFT); U.store.del(DONE); S = { nickname: '', step: 0, answers: {} }; history.replaceState(null, '', U.url(location.pathname)); }
  S.step ? route() : intro();
  window.RR_subBadges = subBadges;
})();
