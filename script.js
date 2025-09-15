const GOAL = 28200000;
let chartInstance = null;

function changeMode(type) {
  // ボタンのactive切り替え
  document.querySelectorAll('.selector button').forEach(btn => btn.classList.remove('active'));
  if (type === '速報') document.getElementById('btn-sokuho').classList.add('active');
  if (type === '確定') document.getElementById('btn-kakutei').classList.add('active');
  if (type === 'カレンダー') document.getElementById('btn-calendar').classList.add('active');
  if (type === '週別') document.getElementById('btn-week').classList.add('active');
  if (type === '曜日別') document.getElementById('btn-weekday').classList.add('active');

  // 表示テキスト切り替え
  const modeText = {
    '速報': '現在：速報版表示中',
    '確定': '現在：公式版表示中',
    'カレンダー': '現在：カレンダー表示中',
    '週別': '現在：週別グラフ表示中',
    '曜日別': '現在：曜日別グラフ表示中'
  };
  document.getElementById('currentMode').textContent = modeText[type];

  // データ切り替え
  loadData(type);
}

function loadData(type) {
  const chartArea = document.getElementById("visitor-chart");
  const desc = document.querySelector('.chart-description');
  const barArea = document.getElementById('bar-charts');
  if (barArea) barArea.style.display = 'none';

  if (type === '週別' || type === '曜日別') {
    chartArea.innerHTML = '';
    chartArea.style.background = "none";
    chartArea.style.border = "none";
    chartArea.style.boxShadow = "none";
    chartArea.style.padding = "0";
    if (desc) desc.style.display = "none";
    fetch('visitors速報.json')
      .then(response => response.json())
      .then(data => {
        // 速報版の累計・関係者数・最終更新・進捗バーを更新
        const daily = data.dailyVisitors;
        const total = daily.reduce((sum, d) => sum + d.count, 0);
        const staff = daily.reduce((sum, d) => sum + d.staff, 0);
        const updated = new Date(data.lastUpdated);
        const progress = (((total - staff) / GOAL) * 100).toFixed(2);

        document.getElementById('visitor-count').textContent = total.toLocaleString() + "人";
        document.getElementById('staff-count').textContent = "うち関係者数: " + staff.toLocaleString() + "人";
        document.getElementById('last-updated').textContent = "最終更新: " + updated.toLocaleString();
        const progressFill = document.getElementById('progress-fill');
        if (progressFill) {
          progressFill.style.width = progress + "%";
          progressFill.textContent = progress + "%";
        }
        showBarCharts(data, type);
      });
    return;
  }

  // ▼ 速報版・公式版に戻った時にグラフ用のスタイル・余白を復元
  if (type !== 'カレンダー') {
    chartArea.innerHTML = '';
    chartArea.style.background = "#f5f5f5";
    chartArea.style.border = "1px solid #ddd";
    chartArea.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
    chartArea.style.padding = "20px";
    createChartCanvas();
    if (desc) desc.style.display = "";
    if (barArea) barArea.style.display = 'none';
  }

  if (type === 'カレンダー') {
    chartArea.style.background = "none";
    chartArea.style.border = "none";
    chartArea.style.boxShadow = "none";
    chartArea.style.padding = "0";
    if (desc) desc.style.display = "none";
    if (barArea) barArea.style.display = 'none';

    fetch('visitors速報.json')
      .then(response => response.json())
      .then(data => {
        const daily = data.dailyVisitors;
        const total = daily.reduce((sum, d) => sum + d.count, 0);
        const staff = daily.reduce((sum, d) => sum + d.staff, 0);
        const updated = new Date(data.lastUpdated);
        const progress = (((total - staff) / GOAL) * 100).toFixed(2);

        document.getElementById('visitor-count').textContent = total.toLocaleString() + "人";
        document.getElementById('staff-count').textContent = "うち関係者数: " + staff.toLocaleString() + "人";
        document.getElementById('last-updated').textContent = "最終更新: " + updated.toLocaleString();
        const progressFill = document.getElementById('progress-fill');
        if (progressFill) {
          progressFill.style.width = progress + "%";
          progressFill.textContent = progress + "%";
        }
        showCalendarTable();
      });
    return;
  }

  const file = type === '速報' ? 'visitors速報.json' : 'visitors確定.json';
  fetch(file)
    .then(response => response.json())
    .then(data => {
      updateDisplay(data);
    })
    .catch(error => {
      console.error('データ読み込みエラー:', error);
    });
}

function createChartCanvas() {
  // visitor-chart内にcanvasがなければ追加
  const chartArea = document.getElementById("visitor-chart");
  if (!chartArea.querySelector("canvas")) {
    const canvas = document.createElement("canvas");
    chartArea.appendChild(canvas);
    return canvas;
  }
  return chartArea.querySelector("canvas");
}

function showCalendarTable() {
  fetch('visitors速報.json')
    .then(response => response.json())
    .then(data => {
      const daily = data.dailyVisitors;
      const year = 2025;
      const calendar = Array(12).fill(null).map(() => Array(7).fill(''));
      let week = 0;
      let prevMonth = null;
      let started = false;

      // 🎆を表示する日付を定義
      const fireworksDates = new Set([
        '04-26', '05-31', '06-28', '07-21', '07-23', '08-23', '09-06', '09-13', '09-20', '09-27', '10-04', '10-08', '10-12', '10-13'
      ]);

      // 祝日を定義（2025年の万博期間中の祝日）
      const holidays = new Set([
        '04-29', // 昭和の日
        '05-03', // 憲法記念日
        '05-04', // みどりの日
        '05-05', // こどもの日
        '05-06', // 振替休日
        '07-21', // 海の日
        '08-11', // 山の日
        '09-15', // 敬老の日
        '09-23', // 秋分の日
        '10-13'  // スポーツの日
      ]);

      daily.some((d, i) => {
        const [mm, dd] = d.date.split('-');
        const dateObj = new Date(`${year}-${mm}-${dd}`);
        const day = dateObj.getDay(); // 0=日曜, 1=月曜, ..., 6=土曜
        const month = Number(mm);

        // 4月13日から開始
        if (!started && mm === "04" && dd === "13") {
          started = true;
          week = 0;
        }

        // 4月13日以前はスキップ
        if (!started) return false;

        // 🎆が必要な日付かチェック
        const isFireworksDate = fireworksDates.has(`${mm}-${dd}`);
        const fireworksIcon = isFireworksDate ? ' 🎆' : '';

        // 祝日かチェック
        const isHoliday = holidays.has(`${mm}-${dd}`);

        // 日付の色を決定
        let dateColor = '#000'; // デフォルト（平日）
        if (day === 0 || isHoliday) { // 日曜日または祝日
          dateColor = '#e53935'; // 赤色
        } else if (day === 6) {
          dateColor = '#1976d2'; // 土曜は青色
        }

        // 月表示がある場合は日付の中央揃えを維持するため、flexで左側に月、中央に日を配置
        let dateLabel = '';
        if ((mm === "04" && dd === "13") || (dd === "01" && month !== prevMonth && mm !== "04")) {
          dateLabel = `
            <div style="font-size:1.1em;font-weight:bold;text-align:left;">
              <span style="color:white;background-color:black;font-size:0.9em;font-weight:bold;padding:2px 4px;border-radius:3px;">${month}月</span><span style="color:${dateColor};">${Number(dd)}日</span>${fireworksIcon}
            </div>`;
          prevMonth = month;
        } else {
          dateLabel = `<div style="font-size:1.1em;font-weight:bold;text-align:center;color:${dateColor};">${Number(dd)}日${fireworksIcon}</div>`;
        }

        // 10月13日までで打ち切り
        if (mm === "10" && dd === "13") {
          calendar[week][day] = `
            ${dateLabel}
            <div style="font-size:1.5em;font-weight:bold;color:#1976d2;line-height:1.2;">${d.count.toLocaleString()}</div>
            <div style="font-size:0.8em;color:#555;">うち関係者数 ${d.staff.toLocaleString()}</div>
          `;
          return true; // someでループ終了
        }

        if (i === 0) week = 0;
        else if (day === 0 && i !== 0) week++;

        // 週が足りなければ新しい週を追加
        if (!calendar[week]) calendar[week] = Array(7).fill('');

        calendar[week][day] = `
          ${dateLabel}
          <div style="font-size:1.3em;font-weight:bold;color:#1976d2;line-height:1.2;">${d.count.toLocaleString()}</div>
          <div style="font-size:0.8em;color:#555;">うち関係者数 ${d.staff.toLocaleString()}</div>
        `;
        return false;
      });

      // テーブルHTML生成（枠線をthead,tbody,td,thすべてに適用）
      let html = `
        <div class="calendar-table-wrapper" style="overflow-x:auto;width:100%;">
          <table class="calendar-table" style="margin:0 auto;width:100%;max-width:800px;min-width:420px;border-collapse:collapse;text-align:center;font-size:clamp(0.8em,2.5vw,1em);">
            <thead>
              <tr>
                <th style="border:1px solid #ccc;padding:6px;color:#e53935;">日</th>
                <th style="border:1px solid #ccc;padding:6px;">月</th>
                <th style="border:1px solid #ccc;padding:6px;">火</th>
                <th style="border:1px solid #ccc;padding:6px;">水</th>
                <th style="border:1px solid #ccc;padding:6px;">木</th>
                <th style="border:1px solid #ccc;padding:6px;">金</th>
                <th style="border:1px solid #ccc;padding:6px;color:#1976d2;">土</th>
              </tr>
            </thead>
            <tbody>
      `;
      for (let w = 0; w < calendar.length; w++) {
        if (calendar[w].every(cell => cell === '')) continue;
        html += '<tr>';
        for (let d = 0; d < 7; d++) {
          html += `<td style="padding:8px 2px;border:1px solid #ccc;min-width:38px;vertical-align:top;background:#fff;word-break:break-word;">${calendar[w][d] || ''}</td>`;
        }
        html += '</tr>';
      }
      html += `
            </tbody>
          </table>
        </div>
      `;

      // 表示エリアを置き換え
      const chartArea = document.getElementById("visitor-chart");
      chartArea.innerHTML = html;

      // グラフ説明文も非表示にする場合
      const desc = document.querySelector('.chart-description');
      if (desc) desc.style.display = "none";
    });
}

function updateDisplay(data) {
  const total = data.dailyVisitors.reduce((sum, d) => sum + d.count, 0);
  const staff = data.dailyVisitors.reduce((sum, d) => sum + d.staff, 0);
  const updated = new Date(data.lastUpdated);

  document.querySelectorAll('.selector button').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.selector button').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
    });
  });

  document.getElementById("visitor-count").textContent = `${total.toLocaleString()}人`;
  document.getElementById("staff-count").textContent = `うち関係者数: ${staff.toLocaleString()}人`;
  document.getElementById("last-updated").textContent = `最終更新: ${updated.toLocaleString()}`;

  // 進捗バー
  const progress = (((total - staff ) / GOAL) * 100).toFixed(2);
  const progressFill = document.getElementById("progress-fill");
  progressFill.style.width = `${progress}%`;
  progressFill.textContent = `${progress}%`;

  // グラフデータ
  const labels = data.dailyVisitors.map(d => d.date);
  const visitorData = data.dailyVisitors.map(d => d.count);
  const staffData = data.dailyVisitors.map(d => d.staff);

  // グラフ描画
  const ctx = document.getElementById("visitor-chart").querySelector("canvas");
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx || createChartCanvas(), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '来場者数',
          data: visitorData,
          fill: true,
          backgroundColor: 'rgba(66, 165, 245, 0.2)',
          borderColor: '#42a5f5',
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 0
        },
        {
          label: 'うち関係者数',
          data: staffData,
          fill: false,
          borderColor: '#ef5350',
          backgroundColor: 'rgba(239, 83, 80, 0.1)',
          borderDash: [5, 5],
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => value.toLocaleString()
          }
        }
      }
    }
  });
}

// 週別・曜日別グラフ描画
function showBarCharts(data, type) {
  let barArea = document.getElementById('bar-charts');
  if (!barArea) {
    barArea = document.createElement('div');
    barArea.id = 'bar-charts';
    barArea.style = 'max-width:700px;margin:30px auto;';
    document.getElementById('visitor-chart').after(barArea);
  }
  barArea.style.display = '';
  barArea.innerHTML = '';

  if (type === '週別') {
    // 週別集計
    const weekMap = new Map();
    data.dailyVisitors.forEach(d => {
      const date = new Date(`2025-${d.date}`);
      const firstDay = new Date(date.getFullYear(), 0, 1);
      const week = Math.floor(((date - firstDay) / 86400000 + firstDay.getDay()) / 7) + 1;
      weekMap.set(week, (weekMap.get(week) || 0) + d.count);
    });
    const weekNumbers = Array.from(weekMap.keys()).sort((a, b) => a - b);
    const weekLabels = weekNumbers.map((_, i) => `第${i + 1}週`);
    const weekData = weekNumbers.map(week => weekMap.get(week));

    barArea.innerHTML = `<canvas id="week-bar"></canvas>`;
    new Chart(document.getElementById('week-bar').getContext('2d'), {
      type: 'bar',
      data: {
        labels: weekLabels,
        datasets: [{
          label: '',
          data: weekData,
          backgroundColor: '#42a5f5'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          // ★ 背景を白に
          background: {
            color: '#fff'
          }
        },
        layout: { backgroundColor: '#fff' }, // 旧バージョン用
        scales: { y: { beginAtZero: true, ticks: { callback: v => v.toLocaleString() } } }
      },
      plugins: [{
        // Chart.js v3/v4用: 背景を白にするカスタムプラグイン
        beforeDraw: (chart) => {
          const ctx = chart.ctx;
          ctx.save();
          ctx.globalCompositeOperation = 'destination-over';
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, chart.width, chart.height);
          ctx.restore();
        }
      }]
    });
  }

  if (type === '曜日別') {
    // 曜日別集計
    const weekdayCounts = Array(7).fill(0);
    data.dailyVisitors.forEach(d => {
      const date = new Date(`2025-${d.date}`);
      const day = date.getDay();
      weekdayCounts[day] += d.count;
    });
    const weekdayLabels = ['日', '月', '火', '水', '木', '金', '土'];
    barArea.innerHTML = `<canvas id="weekday-bar"></canvas>`;
    new Chart(document.getElementById('weekday-bar').getContext('2d'), {
      type: 'bar',
      data: {
        labels: weekdayLabels,
        datasets: [{
          label: '',
          data: weekdayCounts,
          backgroundColor: [
            '#e53935', '#90caf9', '#90caf9', '#90caf9', '#90caf9', '#90caf9', '#1976d2'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          // ★ 背景を白に
          background: {
            color: '#fff'
          }
        },
        layout: { backgroundColor: '#fff' }, // 旧バージョン用
        scales: { y: { beginAtZero: true, ticks: { callback: v => v.toLocaleString() } } }
      },
      plugins: [{
        // Chart.js v3/v4用: 背景を白にするカスタムプラグイン
        beforeDraw: (chart) => {
          const ctx = chart.ctx;
          ctx.save();
          ctx.globalCompositeOperation = 'destination-over';
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, chart.width, chart.height);
          ctx.restore();
        }
      }]
    });
  }
}

// 初期表示
loadData("速報");