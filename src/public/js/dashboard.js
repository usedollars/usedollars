const API_BASE = window.location.origin;

// Cargar datos del backend
async function refreshData() {
  try {
    const res = await fetch(`${API_BASE}/api/dashboard/refresh`);
    if (!res.ok) throw new Error("HTTP " + res.status);

    const payload = await res.json();
    const data = payload.data;

    // Balance
    document.getElementById("balance-total").textContent =
      data.balance.toFixed(2);

    // Transacciones recientes
    const list = document.getElementById("transacciones-recientes");
    list.innerHTML = "";
    (data.recentTransactions || []).forEach(tx => {
      const li = document.createElement("li");
      const dateStr = new Date(tx.createdAt).toLocaleString();
      li.textContent = `${tx.type} — ${tx.amount} ${tx.currency} — ${tx.status} (${dateStr})`;
      list.appendChild(li);
    });

  } catch (err) {
    console.error("Error cargando dashboard:", err);
    alert("No se pudo actualizar datos: " + err.message);
  }
}

// Cargar al iniciar
document.addEventListener("DOMContentLoaded", () => {
  refreshData();
  setInterval(refreshData, 30000); // refresco cada 30s
});

