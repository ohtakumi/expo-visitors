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
  const chartArea = document.getElementById("visitor-chart");
  const desc = document.querySelector('.chart-description');
  // カレンダー以外の時はカレンダーを消してグラフ用canvasを用意
  if (type !== 'カレンダー') {
    chartArea.innerHTML = ""; // カレンダーを消す
    chartArea.style.background = "#f5f5f5"; // グラフ用の背景色に戻す
    chartArea.style.border = "1px solid #ddd"; // 枠線を戻す
    chartArea.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)"; // box-shadowを戻す
    // グラフ用canvasを追加
    createChartCanvas();
    // .chart-descriptionを表示
    if (desc) desc.style.display = "";
  }

  if (type === 'カレンダー') {
    chartArea.style.background = "none"; // カレンダー時は背景を消す
    chartArea.style.border = "none";     // カレンダー時は枠線も消す
    chartArea.style.boxShadow = "none";  // カレンダー時はbox-shadowも消す
    showCalendarTable();
    // .chart-descriptionを非表示
    if (desc) desc.style.display = "none";
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

      daily.some((d, i) => {
        const [mm, dd] = d.date.split('-');
        const dateObj = new Date(`${year}-${mm}-${dd}`);
        const day = dateObj.getDay();
        const month = Number(mm);

        // 4月13日から開始
        if (!started && mm === "04" && dd === "13") {
          started = true;
          week = 0;
        }

        // 4月13日以前はスキップ
        if (!started) return false;

        // 月表示がある場合は日付の中央揃えを維持するため、flexで左側に月、中央に日を配置
        let dateLabel = '';
        if ((mm === "04" && dd === "13") || (dd === "01" && month !== prevMonth && mm !== "04")) {
          dateLabel = `
            <div style="display:flex;align-items:center;justify-content:center;">
              <span style="color:#d84315;font-weight:bold;font-size:0.9em;width:2.5em;min-width:2.5em;text-align:right;display:inline-block;">${month}月</span>
              <span style="font-size:1.1em;font-weight:bold;flex:1;text-align:center;display:inline-block;min-width:2.5em;">${Number(dd)}</span>
            </div>`;
          prevMonth = month;
        } else {
          // 月表示がない場合も日付を中央に
          dateLabel = `<div style="font-size:1.1em;font-weight:bold;text-align:center;min-width:4em;display:block;margin:0 auto;">${Number(dd)}</div>`;
        }

        // 10月13日までで打ち切り
        if (mm === "10" && dd === "13") {
          calendar[week][day] = `
            ${dateLabel}
            <div style="font-size:1.5em;font-weight:bold;color:#1976d2;line-height:1.2;">${d.count.toLocaleString()}</div>
            <div style="font-size:0.8em;color:#888;">うち関係者数 ${d.staff.toLocaleString()}</div>
          `;
          return true; // someでループ終了
        }

        if (i === 0) week = 0;
        else if (day === 0 && i !== 0) week++;
        calendar[week][day] = `
          ${dateLabel}
          <div style="font-size:1.5em;font-weight:bold;color:#1976d2;line-height:1.2;">${d.count.toLocaleString()}</div>
          <div style="font-size:0.8em;color:#888;">うち関係者数 ${d.staff.toLocaleString()}</div>
        `;
        return false;
      });

      // テーブルHTML生成（枠線をthead,tbody,td,thすべてに適用）
      let html = `
        <table class="calendar-table" style="margin:0 auto;width:100%;max-width:600px;border-collapse:collapse;text-align:center;">
          <thead>
            <tr>
              <th style="border:1px solid #ccc;padding:6px;">日</th>
              <th style="border:1px solid #ccc;padding:6px;">月</th>
              <th style="border:1px solid #ccc;padding:6px;">火</th>
              <th style="border:1px solid #ccc;padding:6px;">水</th>
              <th style="border:1px solid #ccc;padding:6px;">木</th>
              <th style="border:1px solid #ccc;padding:6px;">金</th>
              <th style="border:1px solid #ccc;padding:6px;">土</th>
            </tr>
          </thead>
          <tbody>
      `;
      for (let w = 0; w < calendar.length; w++) {
        if (calendar[w].every(cell => cell === '')) continue;
        html += '<tr>';
        for (let d = 0; d < 7; d++) {
          html += `<td style="padding:8px 4px;border:1px solid #ccc;min-width:44px;vertical-align:top;background:#fff;">${calendar[w][d] || ''}</td>`;
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
