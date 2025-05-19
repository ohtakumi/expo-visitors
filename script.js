const GOAL = 28200000;
let chartInstance = null;

function loadData(type) {
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
