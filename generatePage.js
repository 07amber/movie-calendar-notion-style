/**
 * Generate a self-contained static calendar page (`web/index.html`)
 * by embedding `data/movies.json` into the HTML.
 *
 * Why embed?
 * - so the user can open `web/index.html` directly (no local server needed)
 * - posters are remote URLs (TMDB image CDN), so they still load normally
 */

const fs = require("fs");
const path = require("path");

const moviesPath = path.join(__dirname, "..", "data", "movies.json");
const outPath = path.join(__dirname, "index.html");

const movies = JSON.parse(fs.readFileSync(moviesPath, "utf8"));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Small CSS/JS are kept inline for a single-file deliverable experience.
const html = `<!doctype html>
<html lang="zh">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Movie Calendar (TMDB)</title>
    <style>
      :root{
        --bg: #0b1020;
        --panel: rgba(255,255,255,0.06);
        --panel2: rgba(255,255,255,0.09);
        --text: rgba(255,255,255,0.92);
        --muted: rgba(255,255,255,0.68);
        --border: rgba(255,255,255,0.12);
        --shadow: 0 18px 60px rgba(0,0,0,0.35);
        --mainland: #3b82f6;
        --hk: #a855f7;
        --radius: 18px;
      }

      *{ box-sizing: border-box; }
      body{
        margin:0;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";
        background:
          radial-gradient(1200px 600px at 15% 10%, rgba(59,130,246,0.20), transparent 60%),
          radial-gradient(1000px 500px at 85% 0%, rgba(168,85,247,0.18), transparent 55%),
          radial-gradient(900px 500px at 50% 100%, rgba(16,185,129,0.10), transparent 65%),
          var(--bg);
        color: var(--text);
      }
      .wrap{
        max-width: 1200px;
        margin: 28px auto 60px;
        padding: 0 18px;
      }
      header{
        display:flex;
        align-items:flex-end;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 16px;
      }
      h1{
        margin:0;
        font-size: 22px;
        letter-spacing: 0.2px;
      }
      .sub{
        margin-top: 6px;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.4;
      }
      .controls{
        display:flex;
        flex-direction: column;
        gap: 10px;
        padding: 12px 14px;
        border: 1px solid var(--border);
        background: var(--panel);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
      }
      .filters{
        display:flex;
        gap: 12px;
        align-items:center;
        flex-wrap: wrap;
      }
      .pill{
        display:flex;
        gap: 10px;
        align-items:center;
        padding: 8px 10px;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: rgba(255,255,255,0.04);
        user-select:none;
      }
      .pill input{ transform: scale(1.1); }
      .badge{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        font-size: 12px;
        padding: 6px 10px;
        border-radius: 999px;
        border: 1px solid var(--border);
      }
      .badge.mainland{ background: rgba(59,130,246,0.16); color: #93c5fd; border-color: rgba(59,130,246,0.35); }
      .badge.hk{ background: rgba(168,85,247,0.14); color: #d8b4fe; border-color: rgba(168,85,247,0.32); }
      .legend{
        display:flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .monthGrid{
        display:grid;
        gap: 18px;
        margin-top: 18px;
      }

      .month{
        border: 1px solid var(--border);
        background: var(--panel);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        overflow:hidden;
      }
      .monthHead{
        display:flex;
        align-items:center;
        justify-content: space-between;
        gap: 10px;
        padding: 14px 16px;
        border-bottom: 1px solid var(--border);
        background: linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03));
      }
      .monthTitle{
        font-size: 18px;
        font-weight: 700;
      }
      .monthMeta{
        color: var(--muted);
        font-size: 13px;
      }

      .dow{
        display:grid;
        grid-template-columns: repeat(7, 1fr);
        padding: 12px 14px 0;
        gap: 8px;
      }
      .dow div{
        color: var(--muted);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
      }

      .days{
        display:grid;
        grid-template-columns: repeat(7, 1fr);
        padding: 10px 14px 16px;
        gap: 8px;
      }

      .day{
        min-height: 102px;
        padding: 10px 10px;
        border: 1px solid rgba(255,255,255,0.08);
        background: rgba(0,0,0,0.10);
        border-radius: 14px;
        position: relative;
        overflow:hidden;
      }
      .day.muted{
        opacity: 0.55;
        background: rgba(0,0,0,0.05);
      }

      .dayNumRow{
        display:flex;
        align-items:center;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 6px;
      }
      .dayNum{
        font-weight: 650;
        font-size: 14px;
      }
      .count{
        color: var(--muted);
        font-size: 12px;
      }
      .today{
        outline: 2px solid rgba(16,185,129,0.45);
        box-shadow: 0 0 0 4px rgba(16,185,129,0.10);
      }

      .cards{
        display:flex;
        flex-direction: column;
        gap: 8px;
      }
      .card{
        display:flex;
        gap: 8px;
        align-items:flex-start;
        padding: 8px 8px;
        border-radius: 12px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.10);
      }
      .card img{
        width: 46px;
        height: 68px;
        object-fit: cover;
        border-radius: 10px;
        background: rgba(255,255,255,0.05);
        flex: 0 0 auto;
      }
      .card .info{
        flex: 1 1 auto;
        min-width: 0;
      }
      .t{
        display:flex;
        align-items:flex-start;
        justify-content: space-between;
        gap: 10px;
      }
      .title{
        font-size: 12.5px;
        font-weight: 650;
        line-height: 1.2;
        word-break: break-word;
      }
      .title small{
        display:block;
        color: var(--muted);
        font-weight: 500;
        margin-top: 3px;
      }
      .regionTag{
        font-size: 11px;
        padding: 4px 8px;
        border-radius: 999px;
        border: 1px solid var(--border);
        white-space: nowrap;
        flex: 0 0 auto;
        margin-left: auto;
      }
      .regionTag.mainland{ background: rgba(59,130,246,0.18); color: #93c5fd; border-color: rgba(59,130,246,0.35); }
      .regionTag.hk{ background: rgba(168,85,247,0.14); color: #d8b4fe; border-color: rgba(168,85,247,0.32); }

      .card a{
        color: inherit;
        text-decoration: none;
      }
      .card a:hover .title{
        text-decoration: underline;
      }

      .footNote{
        margin-top: 16px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.5;
        text-align:center;
      }

      @media (max-width: 980px){
        .day{ min-height: 96px; }
      }
      @media (max-width: 760px){
        .dow{ padding-left: 10px; padding-right: 10px; }
        .days{ padding-left: 10px; padding-right: 10px; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <header>
        <div>
          <h1>电影上映日历（内地 / 香港）</h1>
          <div class="sub">数据来自 TMDB：按地区过滤（Mainland China / Hong Kong）+ 上映日期范围生成日历。</div>
        </div>

        <div class="controls">
          <div class="legend">
            <span class="badge mainland">内地</span>
            <span class="badge hk">香港</span>
          </div>
          <div class="filters">
            <label class="pill"><input id="fMainland" type="checkbox" checked /> 内地</label>
            <label class="pill"><input id="fHK" type="checkbox" checked /> 香港</label>
          </div>
          <div style="color: var(--muted); font-size: 12px;">
            提示：点击电影卡片标题可打开 IMDb 页面。
          </div>
        </div>
      </header>

      <div id="monthGrid" class="monthGrid"></div>
      <div class="footNote">Generated from <code style="color: var(--muted);">${esc(moviesPath)}</code></div>
    </div>

    <script>
      window.MOVIES = ${JSON.stringify(movies)};
    </script>
    <script>
      const MOVIES = window.MOVIES || [];

      const regionKey = (r) => {
        if (r === 'Mainland China') return 'mainland';
        if (r === 'Hong Kong') return 'hk';
        return 'unknown';
      };

      const monthNameZh = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
      const dow = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

      function pad2(n){ return String(n).padStart(2,'0'); }
      function ymKey(dateStr){
        const [y,m]=dateStr.split('-');
        return y + '-' + m;
      }
      function dayKey(dateStr){
        return dateStr;
      }

      function groupByMonth(movies){
        const g = new Map();
        for (const m of movies){
          if (!m || !m.release_date) continue;
          const k = ymKey(m.release_date);
          if (!g.has(k)) g.set(k, []);
          g.get(k).push(m);
        }
        // sort movies by date asc then region then title
        for (const [k, arr] of g.entries()){
          arr.sort((a,b)=> {
            if (a.release_date !== b.release_date) return a.release_date.localeCompare(b.release_date);
            const ra = (a.region||'').localeCompare(b.region||'');
            if (ra !== 0) return ra;
            return (a.title_en||'').localeCompare(b.title_en||'');
          });
        }
        return g;
      }

      const monthGrid = document.getElementById('monthGrid');

      function makeMonthCard({year, monthIndex0, movies}){
        const firstDay = new Date(year, monthIndex0, 1);
        // Monday start: 0..6
        const jsDow = firstDay.getDay(); // Sun=0..Sat=6
        const mondayIndex = (jsDow + 6) % 7;

        const lastDayNum = new Date(year, monthIndex0 + 1, 0).getDate();

        const monthEl = document.createElement('section');
        monthEl.className = 'month';

        const monthTitle = monthNameZh[monthIndex0] + ' ' + year;
        const rangeMin = movies[0]?.release_date;
        const rangeMax = movies[movies.length-1]?.release_date;

        monthEl.innerHTML = \`
          <div class="monthHead">
            <div class="monthTitle">\${monthTitle}</div>
            <div class="monthMeta">\${rangeMin} ~ \${rangeMax}（共 \${movies.length} 部）</div>
          </div>
          <div class="dow">\${dow.map(x => '<div>'+x+'</div>').join('')}</div>
          <div class="days"></div>
        \`;

        const daysEl = monthEl.querySelector('.days');

        // Build a lookup by day
        const byDay = new Map();
        for (const m of movies){
          const k = dayKey(m.release_date);
          if (!byDay.has(k)) byDay.set(k, []);
          byDay.get(k).push(m);
        }

        const todayStr = new Date().toISOString().slice(0,10);
        const showMainland = () => document.getElementById('fMainland')?.checked ?? true;
        const showHK = () => document.getElementById('fHK')?.checked ?? true;

        const renderCards = (cards, dateStr) => {
          const filtered = cards.filter(c => {
            const rk = regionKey(c.region);
            if (rk === 'mainland') return showMainland();
            if (rk === 'hk') return showHK();
            return true;
          });

          // Keep cell clean: cap to 3 cards (show "+N" if more).
          const cap = 3;
          const shown = filtered.slice(0, cap);
          const extra = filtered.length - shown.length;

          return \`
            \${shown.map(c => {
              const rk = regionKey(c.region);
              const tagClass = rk === 'mainland' ? 'mainland' : (rk === 'hk' ? 'hk' : '');
              const poster = c.poster || '';
              const titleLocal = c.title_local || c.title_en || '';
              const titleEn = c.title_en ? c.title_en : '';
              const link = c.link || '#';
              return \`
                <div class="card">
                  <img src="\${poster}" alt="\${escHtml(titleLocal)}" loading="lazy" />
                  <div class="info">
                    <div class="t">
                      <a href="\${link}" target="_blank" rel="noreferrer noopener">
                        <div class="title">\${escapeHtml(titleLocal)}
                          \${titleEn && titleLocal !== titleEn ? '<small>'+escapeHtml(titleEn)+'</small>' : '<small>'+escapeHtml(titleEn)+'</small>'}
                        </div>
                      </a>
                      <div class="regionTag \${tagClass}">\${escapeHtml(c.region || '')}</div>
                    </div>
                  </div>
                </div>
              \`;
            }).join('')}
            \${extra > 0 ? '<div style="color: rgba(255,255,255,0.65); font-size: 12px; padding-left: 2px;">+ '+extra+' more</div>' : ''}
          \`;
        };

        // Need escaping helpers in renderCards scope.
        function escapeHtml(str){
          return String(str)
            .replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;')
            .replace(/'/g,'&#039;');
        }
        function escHtml(str){ return escapeHtml(str); }

        // Leading blanks
        for (let i=0;i<mondayIndex;i++){
          const cell = document.createElement('div');
          cell.className = 'day muted';
          cell.innerHTML = '<div class="dayNumRow"><div class="dayNum"> </div><div class="count"></div></div><div class="cards"></div>';
          daysEl.appendChild(cell);
        }

        for (let day=1; day<=lastDayNum; day++){
          const dateStr = year + '-' + pad2(monthIndex0+1) + '-' + pad2(day);
          const cards = byDay.get(dateStr) || [];

          const cell = document.createElement('div');
          cell.className = 'day';

          if (dateStr === todayStr) cell.classList.add('today');

          cell.innerHTML = \`
            <div class="dayNumRow">
              <div class="dayNum">\${day}</div>
              <div class="count">\${cards.length ? cards.length : ''}</div>
            </div>
            <div class="cards">\${renderCards(cards, dateStr)}</div>
          \`;
          daysEl.appendChild(cell);
        }

        return monthEl;
      }

      function render(){
        monthGrid.innerHTML = '';
        const grouped = groupByMonth(MOVIES);
        const keys = Array.from(grouped.keys()).sort();
        for (const k of keys){
          const [y, m] = k.split('-').map(Number);
          const monthIndex0 = m - 1;
          const movies = grouped.get(k) || [];
          // If date range includes other months, still render only those present.
          monthGrid.appendChild(makeMonthCard({year: y, monthIndex0, movies}));
        }
      }

      // Filter re-render without losing scroll position.
      document.addEventListener('change', (e) => {
        const t = e.target;
        if (!t || (t.id !== 'fMainland' && t.id !== 'fHK')) return;
        render();
      });

      render();
    </script>
  </body>
</html>`;

fs.writeFileSync(outPath, html, "utf8");
console.log("Generated web page: " + outPath);

