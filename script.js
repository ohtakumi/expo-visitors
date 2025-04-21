const GOAL = 28000000;
const chartContainer = document.getElementById("visitor-chart");
let chart;

function loadData(mode) {
  fetch(`visitors${mode}.json`)
    .then(res => res.json())
    .then(data => {
      updateStats(data);
      updateChart(data);
    })
    .catch(err => {
      console.error("読み込みエラー:", err);
    });
}

function updateStats(data) {
  const total = data.totalVisitors;
  const staff = data.staffVisitors ?? 0;

  document.getElementById("visitor-count").textContent = `${total.toLocaleString()}人`;
  document.getElementById("staff-count").textContent = `関係者数: ${staff.toLocaleString()}人`;
  document.getElementById("last-updated").textContent = `最終更新: ${new Date(data.lastUpdated).toLocaleString()}`;

  const progress = ((total / GOAL) * 100).toFixed(2);
  const fill = document.getElementById("progress-fill");
  fill.style.width = `${progress}%`;
  fill.textContent = `${progress}%`;
}

function updateChart(data) {
  const labels = data.dailyVisitors.map(d => d.date);
  const staffData = data.dailyVisitors.map(d => d.staff || 0);
  const generalData = data.dailyVisitors.map(d => d.count - (d.staff || 0));

  if (chart) chart.destroy();

  const canvas = document.createElement("canvas");
  chartContainer.innerHTML = "";
  chartContainer.appendChild(canvas);

  chart = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "一般来場者",
          data: generalData,
          backgroundColor: "#42a5f5"
        },
        {
          label: "関係者",
          data: staffData,
          backgroundColor: "#ef5350"
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: {
            callback: val => val.toLocaleString()
          }
        }
      }
    }
  });
}

document.querySelectorAll('input[name="mode"]').forEach(input => {
  input.addEventListener("change", e => {
    loadData(e.target.value);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  loadData("速報");
});
