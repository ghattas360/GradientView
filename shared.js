/* GradientView — shared chrome (command bar, nav, footer) injected on every page */
(function(){
  var PAGES = [
    {href:'index.html', label:'Home'},
    {href:'portfolio.html', label:'Portfolio'},
    {href:'desks.html', label:'Options Desks'},
    {href:'value.html', label:'Value'},
    {href:'learn.html', label:'Learn'},
    {href:'pricing.html', label:'Pricing'},
    {href:'methodology.html', label:'Methodology'}
  ];
  var current = (location.pathname.split('/').pop() || 'index.html');

  // ---- command bar ----
  var tape='<span>SPX <b class="up">5,912.4 +0.6%</b></span><span>NDX <b class="up">+0.9%</b></span><span>VIX <b class="down">14.8 −4.2%</b></span><span class="amber">GAMMA FLIP 5885</span><span>US10Y <b class="down">4.21 −2bp</b></span><span>CL <b class="up">+1.1%</b></span><span>GC <b class="up">2,388 +0.3%</b></span><span class="amber">PUT/CALL 0.84</span><span>BTC <b class="up">+2.4%</b></span><span class="amber">SPY IV RANK 38</span><span>VRP <b class="up">+3.1</b></span><span>EURUSD <b class="up">+0.1%</b></span>';
  var cmd=document.createElement('div');
  cmd.className='cmdbar';
  cmd.setAttribute('aria-hidden','true');
  cmd.innerHTML='<span class="prompt">GV&gt; '+ (current.replace('.html','').toUpperCase()||'HOME') +'&lt;GO&gt;</span><div class="tape"><span class="tape-inner">'+tape+tape+tape+tape+'</span></div>';

  // ---- nav ----
  var nav=document.createElement('nav');
  nav.className='nav';
  var links = PAGES.map(function(p){
    var active = (p.href===current) ? ' active':'';
    return '<a class="nav-link'+active+'" href="'+p.href+'">'+p.label+'</a>';
  }).join('');
  nav.innerHTML =
    '<a class="logo" href="index.html"><span class="mark"><img src="gv-logo-eye.png" alt="GradientView logo" style="width:100%;height:100%;object-fit:contain"></span><span><span class="q">Gradient</span>View</span></a>'+
    '<button class="nav-toggle" aria-label="Menu" onclick="document.getElementById(\'navlinks\').classList.toggle(\'open\')">MENU</button>'+
    '<div class="nav-links" id="navlinks">'+links+
      '<a class="nav-cta" href="index.html#join">Request access</a>'+
    '</div>';

  // ---- footer ----
  var footer=document.createElement('footer');
  footer.className='footer';
  footer.innerHTML =
    '<div class="footer-cols">'+
      '<div><div class="logo"><span class="mark"><img src="gv-logo-eye.png" alt="GradientView logo" style="width:100%;height:100%;object-fit:contain"></span><span><span class="q">Gradient</span>View</span></div><p class="tagline">A quant risk desk for your own book. Insight, not raw data.</p></div>'+
      '<div><h4>Product</h4><a href="portfolio.html">Portfolio</a><a href="desks.html">Options Desks</a><a href="value.html">Value Screener</a><a href="pricing.html">Pricing</a></div>'+
      '<div><h4>Learn</h4><a href="learn.html">Signal Atlas</a><a href="learn.html#paths">Learning paths</a><a href="methodology.html">Methodology</a><a href="methodology.html#evidence">Evidence grading</a></div>'+
      '<div><h4>Community</h4><a href="#">X / Twitter</a><a href="#">Discord</a><a href="#">Newsletter</a><a href="index.html#join">Waitlist</a></div>'+
    '</div>'+
    '<p class="disclaimer">GradientView provides analytics and decision-support tools for informational purposes only. Nothing here is investment, financial, tax, or legal advice, or a recommendation to buy or sell any security. All figures shown are illustrative. Trading involves risk, including possible loss of principal. GradientView never places trades and never stores brokerage credentials — connections are read-only via trusted aggregators. Not affiliated with, endorsed by, or connected to Bloomberg L.P. or any other financial-data provider.</p>';

  document.body.insertBefore(cmd, document.body.firstChild);
  document.body.insertBefore(nav, cmd.nextSibling);
  document.body.appendChild(footer);

  // ---- theme: default dark, toggle to light; persist within session ----
  if(!document.body.getAttribute('data-theme')){
    var saved = (window.__gvTheme || 'dark');
    document.body.setAttribute('data-theme', saved);
  }
  function syncToggleIcon(){
    var t=document.body.getAttribute('data-theme');
    var btn=document.getElementById('themeToggle');
    if(btn) btn.textContent = (t==='dark' ? '◐' : '◑');
  }
  syncToggleIcon();
  var tbtn=document.getElementById('themeToggle');
  if(tbtn){
    tbtn.addEventListener('click', function(){
      var next = document.body.getAttribute('data-theme')==='dark' ? 'light' : 'dark';
      document.body.setAttribute('data-theme', next);
      window.__gvTheme = next;
      try{ localStorage.setItem('gv-theme', next); }catch(e){}
      syncToggleIcon();
    });
  }

  // ---- waitlist handlers (any .waitlist form) ----
  document.querySelectorAll('form.waitlist').forEach(function(f){
    f.addEventListener('submit', function(e){
      e.preventDefault();
      var ep=f.getAttribute('data-endpoint');
      var email=f.querySelector('input').value;
      var ok=f.getAttribute('data-success');
      var showSuccess=function(){ f.style.display='none'; if(ok){var el=document.getElementById(ok); if(el) el.style.display='block';} };
      if(ep && ep.indexOf('REPLACE')===-1){
        var btn=f.querySelector('button'); if(btn){btn.disabled=true;btn.textContent='Sending…';}
        fetch(ep,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({email:email})})
          .then(function(r){
            if(r.ok){ showSuccess(); }
            else { if(btn){btn.disabled=false;btn.textContent='Try again';} }
          })
          .catch(function(){ if(btn){btn.disabled=false;btn.textContent='Try again';} });
      } else { showSuccess(); } // demo mode when no endpoint configured
    });
  });
})();

/* ============================================================
   GradientView — LIVE TICKER (Option B: real quotes, no backend)
   Provider: Finnhub (finnhub.io) — free tier, browser-callable.
   ------------------------------------------------------------
   SETUP (2 minutes):
   1. Sign up free at https://finnhub.io  → copy your API key.
   2. Paste it into FINNHUB_KEY below.
   3. (Recommended) In the Finnhub dashboard, restrict the key to
      your domain so nobody can reuse it elsewhere.
   NOTES:
   - Free tier = delayed/limited data (do NOT label it "real-time").
   - The key is visible in browser code — that's fine for a FREE key.
     Never put a paid key here; use a serverless function for that later.
   - Free rate limit ~60 calls/min. We fetch a small symbol set every
     REFRESH_MS, which stays well under the cap.
   ============================================================ */

(function () {
  var FINNHUB_KEY = "d9ru5ihr01qoo7o5s73gd9ru5ihr01qoo7o5s740";   // <-- your free key
  var REFRESH_MS  = 60000;                            // refresh every 60s

  // Symbols to show. Finnhub uses these tickers for US equities/ETFs.
  // (Indices/futures need different symbols on the free tier, so we use
  //  liquid ETFs as proxies: SPY≈S&P500, QQQ≈Nasdaq100, etc.)
  var SYMBOLS = [
    { sym: "SPY",  label: "SPY"  },
    { sym: "QQQ",  label: "QQQ"  },
    { sym: "DIA",  label: "DIA"  },
    { sym: "IWM",  label: "IWM"  },
    { sym: "AAPL", label: "AAPL" },
    { sym: "NVDA", label: "NVDA" },
    { sym: "TSLA", label: "TSLA" },
    { sym: "GLD",  label: "GLD"  },
    { sym: "BTC-USD", label: "BTC", crypto: true } // shown only if provider returns it
  ];

  var tapeInner = null;

  function fmt(n) {
    if (n == null || isNaN(n)) return "—";
    return n >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 2 })
                     : n.toFixed(2);
  }

  // Build one tape segment of spans from quote results
  function render(quotes) {
    if (!tapeInner) return;
    var html = "";
    quotes.forEach(function (q) {
      if (q.price == null) return;
      var cls = q.change > 0 ? "up" : (q.change < 0 ? "down" : "");
      var sign = q.change > 0 ? "+" : "";
      var pct = (q.pct == null) ? "" : " " + sign + q.pct.toFixed(2) + "%";
      html += '<span>' + q.label + ' <b class="' + cls + '">' + fmt(q.price) + pct + '</b></span>';
    });
    if (!html) html = '<span class="muted">market data unavailable</span>';
    // duplicate for seamless scroll
    tapeInner.innerHTML = html + html + html + html;
  }

  // Fetch one symbol's quote from Finnhub REST /quote endpoint.
  // Returns {label, price, change, pct} or {label, price:null}
  function fetchQuote(item) {
    var url = "https://finnhub.io/api/v1/quote?symbol=" +
              encodeURIComponent(item.sym) + "&token=" + FINNHUB_KEY;
    return fetch(url)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        // Finnhub /quote returns: c=current, d=change, dp=percentChange
        if (!d || d.c == null || d.c === 0) return { label: item.label, price: null };
        return { label: item.label, price: d.c, change: d.d, pct: d.dp };
      })
      .catch(function () { return { label: item.label, price: null }; });
  }

  function refresh() {
    if (!FINNHUB_KEY || FINNHUB_KEY.indexOf("PASTE_") === 0) {
      // No key yet — leave whatever static tape exists, and log a hint once.
      if (!window.__gvTickerWarned) {
        console.warn("[GradientView ticker] No Finnhub key set — showing static tape. " +
                     "Add your key in live-ticker.js to enable real quotes.");
        window.__gvTickerWarned = true;
      }
      return;
    }
    Promise.all(SYMBOLS.map(fetchQuote)).then(render);
  }

  function init() {
    tapeInner = document.getElementById("tape") ||
                document.querySelector(".tape-inner");
    if (!tapeInner) return; // no tape on this page
    refresh();
    setInterval(refresh, REFRESH_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();