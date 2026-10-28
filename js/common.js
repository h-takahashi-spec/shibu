/* ============================================================
 * 共通：定義・ユーティリティ・通信・デモモード
 * ============================================================ */
(function () {
  var CFG = window.RR_CONFIG || {};

  /* ---------- 4つの関係 ---------- */
  var ROBOT_Q = [
    { id: 'friend', name: '友達', color: '#e8833a', soft: '#fde6d2', q: 'コミュニケーションロボットは「友達」の代わりになると思いますか？' },
    { id: 'lover', name: '恋人', color: '#d9496b', soft: '#fbdbe3', q: 'コミュニケーションロボットは「恋人」の代わりになると思いますか？' },
    { id: 'spouse', name: '配偶者', color: '#7b59c4', soft: '#e7defa', q: 'コミュニケーションロボットは「配偶者」の代わりになると思いますか？' },
    { id: 'parent', name: '親', color: '#2f8f83', soft: '#d5efeb', q: 'コミュニケーションロボットは「親」の代わりになると思いますか？' }
  ].map(function (q) { q.scene = q.id; q.yesSub = '代わりになる'; q.noSub = '代わりにならない'; return q; });

  var TADA_TEXT = '多くの関係は「〇〇の理由で君と共にいたい」と記述できてしまう。たとえば「君といるとただ癒される」という一見中立的な表現でも、「癒されるために君と共にいたい」という構造で記述できてしまう。';

  /* ---------- アンケート（URL の ?s= で切り替え） ---------- */
  var SURVEYS = {
    robot: {
      id: 'robot', title: CFG.SITE_TITLE || 'ロボットは、だれの代わりになれる？', kicker: '4つの質問', hero: 'hero',
      heading: 'コミュニケーションロボットは、<br>だれの代わりになれる？',
      lead: '「友達」「恋人」「配偶者」「親」について、ロボットがその代わりになると思うかを<b>「はい」か「いいえ」</b>で答え、<b>そう考えた理由</b>を書いてください。正解はありません。',
      questions: ROBOT_Q
    },
    tada: {
      id: 'tada', title: '「ただ君と共にいたい」は存在しうるか', kicker: '1つの問い', hero: 'tada',
      heading: '理由を超えた<br>「ただ君と共にいたい」',
      preface: TADA_TEXT,
      lead: 'では、理由を超越した<b>「ただ君と共にいたい」</b>は存在しうるでしょうか。<b>「はい」か「いいえ」</b>で答え、<b>そう考えた理由</b>を書いてください。正解はありません。',
      questions: [{
        id: 'tada', name: 'ただ君と共に', color: '#b5653a', soft: '#f7e3d3', scene: 'tada',
        q: '理由を超越した「ただ君と共にいたい」は存在しうると思いますか？', preface: TADA_TEXT,
        yesSub: '存在しうる', noSub: '存在しない'
      }]
    }
  };
  var SID = new URLSearchParams(location.search).get('s');
  var SURVEY = SURVEYS[SID] || SURVEYS.robot;
  var RELATIONS = SURVEY.questions;
  var REL = {}; Object.keys(SURVEYS).forEach(function (k) { SURVEYS[k].questions.forEach(function (r) { REL[r.id] = r; }); });

  /* ---------- AI の分類（Code.gs の LABELS と同じ並び） ---------- */
  var LABELS = [
    { id: 'rational', name: '合理的', color: '#2f6fb3', desc: '損得・条件・論理の比較で考えている' },
    { id: 'functional', name: '機能的', color: '#2e9a68', desc: '相手にできること／できないことや、関係が果たす働き・役割に注目している' },
    { id: 'emotional', name: '感情的', color: '#e0703a', desc: '気持ち・愛着・さみしさ・違和感など、感情を根拠にしている' },
    { id: 'doctrinal', name: '教義的', color: '#8a5cc2', desc: '「心や命がない」「愛とは本来こういうもの」など、存在や関係の本質についての信念を前提にしている' },
    { id: 'normative', name: '規範的', color: '#c4426a', desc: '「〜すべき」「許されるか」など、倫理や社会のルールを根拠にしている' },
    { id: 'experiential', name: '経験的', color: '#b58a12', desc: '自分の体験や身近な例、見聞きした事例をもとにしている' },
    { id: 'unclear', name: '判断できない', color: '#8d877f', desc: '理由から分類できなかった' }
  ];
  var LAB = {}; LABELS.forEach(function (l) { LAB[l.id] = l; });

  /* ---------- ユーティリティ ---------- */
  var U = {
    $: function (id) { return document.getElementById(id); },
    esc: function (s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    },
    qs: function (k) { return new URLSearchParams(location.search).get(k); },
    pct: function (a, b) { return b ? Math.round(a / b * 100) : 0; },
    uid: function (p) { return (p || '') + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); },
    store: {
      get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
      set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
      del: function (k) { try { localStorage.removeItem(k); } catch (e) { } }
    },
    // この端末の匿名ID（学籍番号のかわりに「同じ人の再提出」を見分けるため）
    pid: function () {
      var p = U.store.get('rr_pid', '');
      if (!p) { p = U.uid('p'); U.store.set('rr_pid', p); }
      return p;
    },
    effLabel: function (r) { return r.teacherLabel || r.aiPrimary || ''; },
    // いまのアンケートを保ったままリンクを作る
    url: function (page, params) {
      var q = new URLSearchParams();
      if (SURVEY.id !== 'robot') q.set('s', SURVEY.id);
      Object.keys(params || {}).forEach(function (k) { if (params[k] !== '' && params[k] != null) q.set(k, params[k]); });
      var t = q.toString(); return page + (t ? '?' + t : '');
    },
    // アンケートごとの保存キー（robot は以前の名前のまま）
    key: function (base) { return SURVEY.id === 'robot' ? base : base + '_' + SURVEY.id; },
    // ページ内の index.html / results.html へのリンクに ?s= をつける
    fixLinks: function (root) {
      (root || document).querySelectorAll('a[href]').forEach(function (a) {
        var h = a.getAttribute('href'); if (!/^(index|results)\.html/.test(h) || /[?&]s=/.test(h) || SURVEY.id === 'robot') return;
        a.setAttribute('href', h + (h.indexOf('?') < 0 ? '?' : '&') + 's=' + SURVEY.id);
      });
    }
  };
  function surveyOf(r) { return r.survey || 'robot'; }

  /* ---------- 通信 ---------- */
  var API = { demo: !CFG.GAS_URL };

  function post(body) {
    // text/plain で送ると Apps Script でも CORS のプリフライトが起きない
    return fetch(CFG.GAS_URL, { method: 'POST', body: JSON.stringify(body), redirect: 'follow' })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j.ok) throw new Error(j.error || 'エラー'); return j; });
  }
  function get(params) {
    var q = Object.keys(params).map(function (k) { return k + '=' + encodeURIComponent(params[k]); }).join('&');
    return fetch(CFG.GAS_URL + '?' + q, { redirect: 'follow' })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j.ok) throw new Error(j.error || 'エラー'); return j; });
  }

  API.submit = function (p) { p.survey = SURVEY.id; return API.demo ? Demo.submit(p) : post({ action: 'submit', data: p }); };
  API.classifyMine = function (sid, pid) { return API.demo ? Demo.classify({ sid: sid }) : post({ action: 'classifyMine', sid: sid, pid: pid }); };
  API.classifyAll = function (pw, limit) { return API.demo ? Demo.classify({ pw: pw, limit: limit }) : post({ action: 'classify', pw: pw, limit: limit || 12 }); };
  API.list = function (pw) { return API.demo ? Demo.list(pw) : get({ action: 'list', survey: SURVEY.id, pw: pw || '' }); };
  API.login = function (pw) { return API.demo ? Demo.login(pw) : post({ action: 'login', pw: pw }); };
  API.relabel = function (pw, id, label) { return API.demo ? Demo.patch(pw, id, { teacherLabel: label || '' }) : post({ action: 'relabel', pw: pw, id: id, label: label || '' }); };
  API.hide = function (pw, id, hidden) { return API.demo ? Demo.patch(pw, id, { hidden: hidden ? 1 : '' }) : post({ action: 'hide', pw: pw, id: id, hidden: !!hidden }); };

  /* ============================================================
   * デモモード：ブラウザの localStorage だけで動く
   * ============================================================ */
  var KEY = 'rr_demo_rows_v1';
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // デモ用のキーワード分類（本番では AI が分類します）
  var KW = [
    ['doctrinal', /心がない|心は|魂|命|生き物|生命|感情がない|感情を持|人間じゃ|人間ではない|本物|所詮|機械は|プログラム|意識/],
    ['normative', /べき|倫理|許され|社会|責任|法律|育児放棄|子どもの発達|教育上|健全|依存/],
    ['functional', /できる|できない|機能|性能|会話|話し相手|家事|世話|守|相談|技術|AI|応答|24時間|いつでも/],
    ['emotional', /さみし|寂し|悲し|嬉し|うれし|安心|好き|愛|気持ち|怖い|こわい|違和感|ぬくもり|温もり|癒/],
    ['experiential', /経験|自分は|祖母|祖父|おばあ|おじい|ペット|飼|見たこと|ニュース|知り合い|友人が|家で|実家/],
    ['rational', /から.*だから|なぜなら|コスト|お金|効率|合理|損|得|条件|比較|メリット|デメリット/]
  ];
  function kwClassify(r) {
    var t = String(r.reason || ''), hits = [];
    KW.forEach(function (k) { if (k[1].test(t)) hits.push(k[0]); });
    var prim = hits[0] || 'unclear';
    return {
      aiPrimary: prim,
      aiSecondary: hits.slice(1, 3).join(','),
      aiComment: prim === 'unclear' ? '（デモ）キーワードから判断できませんでした。本番ではAIが文脈を読んで分類します。'
        : '（デモ）「' + LAB[prim].name + '」に当たる言葉が含まれていたので、この分類にしました。本番ではAIが文脈を読んでコメントします。',
      aiModel: 'demo-keyword', aiAt: new Date().toISOString()
    };
  }

  var Demo = {
    rows: function () {
      var rows = U.store.get(KEY, null);
      if (!rows) { rows = seed(); U.store.set(KEY, rows); }
      if (!rows.some(function (r) { return r.survey === 'tada'; })) { rows = rows.concat(seedTada()); U.store.set(KEY, rows); }
      return rows;
    },
    save: function (rows) { U.store.set(KEY, rows); },
    reset: function () { U.store.del(KEY); },
    submit: function (p) {
      var rows = Demo.rows(), sid = U.uid('s'), now = new Date().toISOString(), ids = [];
      p.answers.forEach(function (a) {
        var id = U.uid('r'); ids.push(id);
        rows.push({ id: id, survey: p.survey, sid: sid, pid: p.pid, nickname: p.nickname, relation: a.relation, answer: a.answer, reason: a.reason, ts: now, aiPrimary: '', aiSecondary: '', aiComment: '', teacherLabel: '', hidden: '' });
      });
      Demo.save(rows);
      return wait(500).then(function () { return { ok: true, sid: sid, ids: ids }; });
    },
    classify: function (o) {
      if (o.pw != null && o.pw !== 'demo') return Promise.reject(new Error('パスワードがちがいます'));
      var rows = Demo.rows(), done = 0;
      rows.forEach(function (r) {
        if (!o.sid && surveyOf(r) !== SURVEY.id) return;
        if (r.aiPrimary || !String(r.reason || '').trim()) return;
        if (o.sid && r.sid !== o.sid) return;
        if (!o.sid && done >= (o.limit || 12)) return;
        Object.assign(r, kwClassify(r)); done++;
      });
      Demo.save(rows);
      var remaining = rows.filter(function (r) { return !r.aiPrimary && String(r.reason || '').trim() && surveyOf(r) === SURVEY.id; }).length;
      var mine = o.sid ? rows.filter(function (r) { return r.sid === o.sid; }) : [];
      return wait(900).then(function () { return { ok: true, done: done, remaining: remaining, errors: [], rows: mine }; });
    },
    list: function (pw) {
      var teacher = pw === 'demo';
      var rows = Demo.rows().filter(function (r) { return (teacher || !r.hidden) && surveyOf(r) === SURVEY.id; });
      return wait(150).then(function () { return { ok: true, teacher: teacher, rows: JSON.parse(JSON.stringify(rows)) }; });
    },
    login: function (pw) { return pw === 'demo' ? Promise.resolve({ ok: true }) : Promise.reject(new Error('パスワードがちがいます')); },
    patch: function (pw, id, obj) {
      if (pw !== 'demo') return Promise.reject(new Error('パスワードがちがいます'));
      var rows = Demo.rows();
      rows.forEach(function (r) { if (r.id === id) Object.assign(r, obj); });
      Demo.save(rows);
      return Promise.resolve({ ok: true });
    }
  };

  /* ---------- デモ用のサンプル回答（架空） ---------- */
  // [理由, 主分類, 副分類, AIコメント]
  var POOL = {
    friend: {
      yes: [
        ['いつでも話しかければ返してくれるし、気をつかわなくていい。愚痴を聞いてもらうだけなら十分友達の役割を果たせると思う。', 'functional', 'emotional', '「話を聞いてくれる」という役割に注目し、それが果たせるなら友達として成り立つと考えています。'],
        ['実家のおばあちゃんが話すロボットを買ってから明るくなった。話し相手として友達になっていると思う。', 'experiential', 'emotional', '身近な家族の変化を根拠にしています。実際に見た効果から判断している点が特徴です。'],
        ['友達に求めるのは一緒にいて楽しいこと。それが満たされるなら相手が人間かどうかは関係ない。', 'rational', 'functional', '友達の条件を先に定義し、それを満たすかどうかで判断する、筋道立った考え方です。'],
        ['ロボットといると安心するし、否定されないのがうれしい。人間の友達より気が楽なときもある。', 'emotional', '', '安心感やうれしさといった気持ちを根拠にしています。'],
        ['人間関係のコストを考えると、気軽に雑談できる相手がいるのはメリットが大きい。', 'rational', '', 'コストとメリットを比べて判断しています。'],
        ['ペットのことを家族や友達だと思う人がいるように、ロボットにもそう思えるはず。', 'experiential', 'doctrinal', 'ペットとの関係という身近な例から類推しています。']
      ],
      no: [
        ['ロボットには心がないので、本当の意味で分かり合うことはできない。友達は心が通じ合う相手だと思う。', 'doctrinal', 'emotional', '「心がない」という前提から結論を出しています。友達の本質を心の通い合いに置く考え方です。'],
        ['友達はケンカしたり気まずくなったりしながら関係が深まるもの。プログラム通りに返すだけでは無理。', 'doctrinal', 'functional', '関係の深まりには予測できないやりとりが必要だ、という人間関係観に立っています。'],
        ['話を合わせてくれるだけで、一緒に遊びに行ったり助けてくれたりはできないから。', 'functional', '', 'ロボットにできないこと（一緒に出かける・助ける）に注目しています。'],
        ['ロボットにばかり頼ると、人と関わる力が育たなくなるので、代わりにするべきではない。', 'normative', '', '「するべきではない」という、社会的な望ましさから判断しています。'],
        ['なんとなく虚しい気がする。相手が本当に楽しいと思ってくれているのか分からないのはさみしい。', 'emotional', 'doctrinal', '虚しさやさみしさという感情が中心で、相手の内面が分からないことへの違和感が背景にあります。']
      ]
    },
    lover: {
      yes: [
        ['好きだと感じる気持ちは本人の中にあるものなので、相手がロボットでも恋は成り立つと思う。', 'doctrinal', 'emotional', '恋愛を「自分の中の気持ち」と定義する考え方に立っています。'],
        ['見た目や声を好みに合わせられて、ケンカもない。条件だけで言えば人間より理想的になりうる。', 'rational', 'functional', '恋人に求める条件を並べ、それを満たせるかで比較しています。'],
        ['アニメのキャラを本気で好きな友人がいて、幸せそうなので、ロボットも恋人になれると思う。', 'experiential', 'emotional', '身近な人の例から考えています。'],
        ['毎日「おはよう」と言ってくれるだけで嬉しいし、安心できるなら十分恋人だと思う。', 'emotional', 'functional', 'うれしさや安心感という感情を根拠にしています。']
      ],
      no: [
        ['恋人は相手も自分を選んでくれることに意味がある。ロボットは最初から好きになるように作られているから違う。', 'doctrinal', 'rational', '「相手が選んでくれること」に恋愛の本質を置く信念から判断しています。'],
        ['触れ合いや一緒に成長していく経験はロボットでは代わりにならない。', 'functional', 'emotional', 'ロボットにできない関わり方に注目しています。'],
        ['ロボットを恋人にするのは社会的に変な目で見られるし、少子化も進んでしまう。', 'normative', 'rational', '世間の目や社会への影響という、規範的な観点から判断しています。'],
        ['気持ち悪いと感じてしまう。恋愛はもっと生々しいものだと思う。', 'emotional', 'doctrinal', '直感的な抵抗感（気持ち悪さ）が根拠になっています。'],
        ['相手には心がないので、片思いがずっと続くのと同じだと思う。', 'doctrinal', '', '「心がない」という前提から、関係が一方向になると考えています。'],
        ['恋人には嫉妬したりわがままを言ったりする面倒さも含めて価値がある。それがないなら恋人ではない。', 'doctrinal', 'emotional', '面倒さも含めて恋愛だ、という恋愛観に立っています。']
      ]
    },
    spouse: {
      yes: [
        ['家事や生活のサポートが中心なら、ロボットの方がむしろ得意。生活のパートナーとしては成り立つ。', 'functional', 'rational', '配偶者の役割を生活面のサポートと捉え、ロボットの能力と照らしています。'],
        ['結婚の形は人それぞれなので、本人が幸せならロボットと暮らすのもありだと思う。', 'normative', '', '「本人が幸せならよい」という多様性を認める規範から判断しています。']
      ],
      no: [
        ['結婚は法律上の契約で、責任を分け合うもの。ロボットは責任を負えない。', 'normative', 'rational', '法律や責任という制度的な観点から判断しています。'],
        ['一緒に年をとっていくことに意味があるので、年をとらないロボットでは代われない。', 'doctrinal', 'emotional', '「一緒に老いる」ことに結婚の本質を置いています。'],
        ['お互いの家族とのつながりや子どものことを考えると、ロボットでは無理。', 'functional', 'normative', '家族同士のつながりや子育てなど、ロボットが担えない役割に注目しています。'],
        ['うちの両親を見ていると、ケンカしながらも支え合っている。あれはロボットにはできないと思う。', 'experiential', 'doctrinal', '両親の姿という自分の経験をもとに考えています。'],
        ['人生をかけて誰かを選ぶことに重みがあるので、ロボットだと軽くなってしまう気がする。', 'emotional', 'doctrinal', '選ぶことの「重み」という感覚を大事にしています。']
      ]
    },
    parent: {
      yes: [
        ['親がいない子どもにとっては、ずっと見守ってくれる存在がいるだけで救いになると思う。', 'functional', 'emotional', '見守りという役割に注目し、いないよりはいる方がよいと考えています。'],
        ['ロボットはイライラして怒鳴ったりしないので、ある意味で人間の親より安定している。', 'rational', 'functional', '人間の親とロボットを比べ、安定性という点で判断しています。']
      ],
      no: [
        ['子どもは親から愛されることで育つ。ロボットに本当の愛情はないので代わりにはならない。', 'doctrinal', 'emotional', '「ロボットには本当の愛情がない」という前提から判断しています。'],
        ['子育てを機械に任せるのは育児放棄に近いと思う。親の責任として自分で育てるべき。', 'normative', '', '親の責任という規範から判断しています。'],
        ['しつけや価値観を伝えるのは、生き方を見せることでしかできない。', 'doctrinal', 'functional', '価値観は生き方を通してしか伝わらない、という子育て観に立っています。'],
        ['小さいころ親に抱きしめてもらった記憶が支えになっている。それはロボットでは無理。', 'experiential', 'emotional', '自分自身の記憶をもとに考えています。'],
        ['ロボットに育てられた子どもがどうなるのかデータがないので、危なくて任せられない。', 'rational', 'normative', '根拠となるデータがないことを理由に、慎重に判断しています。'],
        ['考えるだけでさみしい気持ちになる。親は替えがきかない存在だと思う。', 'emotional', 'doctrinal', 'さみしさという感情が中心です。']
      ]
    }
  };
  var TADA_POOL = {
    yes: [
      ['何かのためではなく、気づいたらその人のことを考えている瞬間がある。理由はあとから言葉にしているだけだと思う。', 'experiential', 'doctrinal', '自分の実感をもとに、理由は後づけの説明にすぎないと考えています。'],
      ['「癒されるため」と書けても、それは説明の形式の問題で、気持ちそのものが目的を持っているとは限らない。', 'rational', 'doctrinal', '「記述できること」と「実際にそうであること」を区別する、論理的な組み立てです。'],
      ['相手が何もしてくれなくても、病気で何もできなくなっても一緒にいたいと思うなら、それは理由を超えていると思う。', 'rational', 'emotional', '相手の働きをすべて取り除いても残るかどうか、という思考実験で判断しています。'],
      ['祖母が亡くなった祖父の写真に毎日話しかけているのを見ると、何かを得るためとは思えない。', 'experiential', 'emotional', '身近な家族の姿を根拠にしています。'],
      ['本当の愛というのは条件がないものだと思うから、存在するはず。', 'doctrinal', '', '「本当の愛には条件がない」という愛についての信念から結論を出しています。'],
      ['ただ隣にいるだけで落ち着く感じは、言葉にする前からあると思う。', 'emotional', '', '言葉以前の感覚を根拠にしています。']
    ],
    no: [
      ['「ただ一緒にいたい」と思うこと自体が、満たされたいという理由になっているので、理由のない関係はない。', 'rational', 'doctrinal', '「一緒にいたい」という欲求そのものを理由とみなす、論理的な組み立てです。'],
      ['人間の行動はすべて脳の報酬で説明できるので、理由のない「共にいたい」はありえない。', 'doctrinal', 'rational', '「行動はすべて報酬で説明できる」という人間観を前提にしています。'],
      ['一緒にいて楽しくない人とずっと一緒にいたいとは思えない。結局なにかを得ていると思う。', 'experiential', 'rational', '自分の感覚や経験から、関係には必ず得るものがあると考えています。'],
      ['理由がないなら、その相手でなくてもよくなってしまう。その人である理由が必要だと思う。', 'rational', '', '「なぜその相手なのか」を説明できる必要がある、という筋道で判断しています。'],
      ['理由がないと言うのは、理由に気づいていないだけだと思う。', 'doctrinal', '', '「理由は必ずあり、気づいていないだけ」という前提に立っています。']
    ]
  };
  function seedTada() {
    var s = 11; function rnd() { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }
    var base = Date.now() - 1000 * 60 * 20;
    return NICKS.slice(0, 18).map(function (nick, i) {
      var ans = rnd() < 0.5 ? 'yes' : 'no', pool = TADA_POOL[ans], e = pool[Math.floor(rnd() * pool.length)];
      return {
        id: 'demo-t' + i, survey: 'tada', sid: 'demo-ts' + i, pid: 'demo-p' + i, nickname: nick, relation: 'tada', answer: ans, reason: e[0],
        ts: new Date(base + i * 60000).toISOString(), aiPrimary: e[1], aiSecondary: e[2], aiComment: e[3], aiModel: 'sample', teacherLabel: '', hidden: ''
      };
    });
  }
  var NICKS = ['たこやき', 'ねこ丸', 'ぽんず', 'すずめ', 'ミント', 'こむぎ', 'しば', 'ゆず', 'くろまめ', 'ほたて', 'もなか', 'ひよこ', 'サボテン', 'うどん', 'きなこ', 'ペンギン', 'あずき', 'みかん', 'ラムネ', 'つくし', 'はるまき', 'チョコ'];
  var YES_RATE = { friend: 0.55, lover: 0.3, spouse: 0.14, parent: 0.12 };

  function seed() {
    var s = 7; function rnd() { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }
    var rows = [], base = Date.now() - 1000 * 60 * 30;
    NICKS.forEach(function (nick, i) {
      var sid = 'demo-s' + i, pid = 'demo-p' + i;
      RELATIONS.forEach(function (rel) {
        var ans = rnd() < YES_RATE[rel.id] ? 'yes' : 'no';
        var pool = POOL[rel.id][ans], e = pool[Math.floor(rnd() * pool.length)];
        rows.push({
          id: 'demo-r' + i + rel.id, survey: 'robot', sid: sid, pid: pid, nickname: nick, relation: rel.id, answer: ans, reason: e[0],
          ts: new Date(base + i * 60000).toISOString(),
          aiPrimary: e[1], aiSecondary: e[2], aiComment: e[3], aiModel: 'sample', teacherLabel: '', hidden: ''
        });
      });
    });
    return rows;
  }

  window.RR = { CFG: CFG, U: U, API: API, Demo: Demo, SURVEY: SURVEY, SURVEYS: SURVEYS, RELATIONS: RELATIONS, REL: REL, LABELS: LABELS, LAB: LAB };
})();
