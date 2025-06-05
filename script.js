const GOAL = 28200000;
let chartInstance = null;

function changeMode(type) {
  // ボタンのactive切り替え
  document.querySelectorAll('.selector button').forEach(btn => btn.classList.remove('active'));
  if (type === '速報') document.getElementById('btn-sokuho').classList.add('active');
  if (type === '確定') document.getElementById('btn-kakutei').classList.add('active');
  if (type === 'カレンダー') document.getElementById('btn-calendar').classList.add('active');

  // 表示テキスト切り替え
  const modeText = {
    '速報': '現在：速報版表示中',
    '確定': '現在：公式版表示中',
    'カレンダー': '現在：カレンダー表示中'
  };
  document.getElementById('currentMode').textContent = modeText[type];

  // データ切り替え
  loadData(type);
}

function loadData(type) {
  if (type === 'カレンダー') {
    showCalendarTable();
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

function showCalendarTable() {
  fetch('visitors速報.json')
    .then(response => response.json())
    .then(data => {
      const daily = data.dailyVisitors;
      const year = 2025; // 固定
      const calendar = Array(12).fill(null).map(() => Array(7).fill('')); // 12週分に拡張
      let week = 0;
      let prevMonth = null;
      let started = false;

      daily.forEach((d, i) => {
        const [mm, dd] = d.date.split('-');
        const dateObj = new Date(`${year}-${mm}-${dd}`);
        const day = dateObj.getDay(); // 0:日, 1:月, ...
        const month = Number(mm);

        // 4月13日から開始
        if (!started && mm === "04" && dd === "13") {
          started = true;
          week = 0;
        }

        // 10月13日までで打ち切り
        if (mm === "10" && dd === "13") {
          // 10月13日も含めて表示
          let dateLabel = `<div style="font-size:1.1em;font-weight:bold;">${Number(dd)}</div>`;
          calendar[week][day] = `
            ${dateLabel}
            <div style="font-size:1.5em;font-weight:bold;color:#1976d2;line-height:1.2;">${d.count.toLocaleString()}</div>
            <div style="font-size:0.95em;color:#888;">関係者数 ${d.staff.toLocaleString()}</div>
          `;
          return false; // forEachを終了
        }

        // 4月の場合は13日から、それ以外は1日から月を強調
        let dateLabel = '';
        if ((mm === "04" && dd === "13") || (dd === "01" && month !== prevMonth && mm !== "04")) {
          dateLabel = `<div style="font-size:0.9em;color:#d84315;font-weight:bold;">${month}月</div><div style="font-size:1.1em;font-weight:bold;">${Number(dd)}</div>`;
          prevMonth = month;
        } else {
          dateLabel = `<div style="font-size:1.1em;font-weight:bold;">${Number(dd)}</div>`;
        }

        // 4月13日以前はスキップ
        if (!started) return;

        if (i === 0) week = 0;
        else if (day === 0 && i !== 0) week++;
        calendar[week][day] = `
          ${dateLabel}
          <div style="font-size:1.5em;font-weight:bold;color:#1976d2;line-height:1.2;">${d.count.toLocaleString()}</div>
          <div style="font-size:0.95em;color:#888;">関係者数 ${d.staff.toLocaleString()}</div>
        `;
      });

      // テーブルHTML生成
      let html = `
        <table class="calendar-table" style="margin:0 auto;max-width:95%;border-collapse:collapse;text-align:center;">
          <thead>
            <tr>
              <th>日</th><th>月</th><th>火</th><th>水</th><th>木</th><th>金</th><th>土</th>
            </tr>
          </thead>
          <tbody>
      `;
      for (let w = 0; w < calendar.length; w++) {
        html += '<tr>';
        for (let d = 0; d < 7; d++) {
          html += `<td style="padding:8px 4px;border:1px solid #ccc;min-width:60px;vertical-align:top;">${calendar[w][d] || ''}</td>`;
        }
        html += '</tr>';
      }
      html += `
          </tbody>
        </table>
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
        },
        {
          label: 'うち関係者数',
          data: staffData,
          fill: false,
          borderColor: '#ef5350',
          backgroundColor: 'rgba(239, 83, 80, 0.1)',
          borderDash: [5, 5],
          tension: 0.3,
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

function createChartCanvas() {
  const canvas = document.createElement("canvas");
  document.getElementById("visitor-chart").appendChild(canvas);
  return canvas;
}

// 初期表示
loadData("速報");
