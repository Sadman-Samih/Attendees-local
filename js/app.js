'use strict';

const App = {
  state: {
    monthIdx: new Date().getMonth(),
    year: new Date().getFullYear(),
  },

  demoMode: false,
  demo: null,

  showStatus(message, type = 'error') {
    const el = document.getElementById('app-status');
    if (!el) return;
    const text = message ? String(message) : '';
    el.textContent = text;
    el.className = 'app-status app-status--' + (type || 'error');
    el.hidden = !text;
  },

  initDemoData() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const logs = [];
    let id = 1;
    for (const emp of [1, 2, 3]) {
      for (const d of [1, 2, 3, 5]) {
        const day = String(d).padStart(2, '0');
        logs.push({
          id: id++,
          employee_id: emp,
          date: `${y}-${m}-${day}`,
          status: 'Present',
          created_at: new Date().toISOString(),
        });
      }
    }
    this.demo = {
      employees: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Carol' },
      ],
      logs,
    };
  },

  async init() {
    const monthSel = document.getElementById('month-select');
    const yearSel = document.getElementById('year-select');

    this.demoMode = !!window.ATTENDANCE_DEMO_MODE;
    if (this.demoMode) {
      this.initDemoData();
      this.showStatus('Demo mode: showing sample data. Configure Supabase to use real data.', 'info');
    } else if (typeof window.supabase === 'undefined' || !window.supabase) {
      this.showStatus('Supabase client failed to load. Check your connection.', 'error');
      return;
    }

    monthSel.value = this.state.monthIdx;
    yearSel.value = this.state.year;

    monthSel.addEventListener('change', () => {
      this.state.monthIdx = parseInt(monthSel.value, 10);
      this.renderGrid();
    });

    yearSel.addEventListener('change', () => {
      this.state.year = parseInt(yearSel.value, 10);
      this.renderGrid();
    });

    document.getElementById('tbody').addEventListener('click', (e) => {
      const btn = e.target.closest('.cell-btn');
      if (!btn || btn.disabled) return;
      this.toggleStatus(btn);
    });

    await this.renderGrid();
  },

  async renderGrid() {
    if (!this.demoMode) this.showStatus('', '');
    const { monthIdx, year } = this.state;
    const monthSel = document.getElementById('month-select');
    const monthName = monthSel && monthSel.options[monthIdx]
      ? monthSel.options[monthIdx].text
      : '';

    try {
      document.getElementById('sheet-title').textContent =
        `Attendance Sheet for ${monthName} - ${year}`;

      const totalDays = new Date(year, monthIdx + 1, 0).getDate();

      const [employees, logs] = await Promise.all([
        this.fetchEmployees(),
        this.fetchLogs(year, monthIdx),
      ]);

      const logsMap = {};
      for (const log of logs) {
        if (!logsMap[log.employee_id]) logsMap[log.employee_id] = {};
        logsMap[log.employee_id][log.date] = {
          status: log.status,
          recordedAt: log.created_at,
        };
      }

      const thead = document.getElementById('table-head');
      let headerHtml = '<tr><th class="col-name">Student Name</th>';
      for (let d = 1; d <= totalDays; d++) {
        headerHtml += `<th>${d}</th>`;
      }
      headerHtml += '<th class="col-present-count">Present Count</th></tr>';
      thead.innerHTML = headerHtml;

      const tbody = document.getElementById('tbody');
      let bodyHtml = '';

      for (const emp of employees) {
        let presentCount = 0;
        const safeName = String(emp.name ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
        let rowHtml = `<tr><td class="col-name">${safeName}</td>`;

        for (let d = 1; d <= totalDays; d++) {
          const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const entry = logsMap[emp.id]?.[dateStr] ?? null;
          const status = entry?.status ?? null;
          const recordedAt = entry?.recordedAt ?? null;

          let cls = 'cell-btn';
          let icon = '';
          let timeText = '';
          if (status === 'Present') {
            cls += ' cell-present';
            icon = '&#10003;';
            presentCount++;
            try {
              const dt = new Date(recordedAt);
              if (!isNaN(dt.getTime())) {
                timeText = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }
            } catch (e) {
              timeText = '';
            }
          }

          rowHtml += `<td><button class="${cls}" data-employee="${emp.id}" data-date="${dateStr}" data-status="${status ?? ''}" aria-label="${safeName} ${dateStr} ${status || 'absent'}">${icon}</button>${timeText ? `<span class="cell-time">${timeText}</span>` : ''}</td>`;
        }

        rowHtml += `<td class="col-present-count">${presentCount}</td></tr>`;
        bodyHtml += rowHtml;
      }

      tbody.innerHTML =
        bodyHtml ||
        '<tr><td colspan="99" style="text-align:center;padding:2rem;color:#999;">No employees found. Add some in Supabase.</td></tr>';

      if (employees.length === 0) {
        this.showStatus('No employees found. Add some in Supabase.', 'info');
      }
    } catch (err) {
      console.error('renderGrid error:', err);
      this.showStatus(
        'Could not load attendance data: ' + (err && err.message ? err.message : err),
        'error'
      );
    }
  },

  async toggleStatus(btn) {
    const employeeId = parseInt(btn.dataset.employee, 10);
    const dateStr = btn.dataset.date;
    const currentStatus = btn.dataset.status;
    const newStatus = currentStatus === 'Present' ? '' : 'Present';

    btn.disabled = true;
    try {
      if (this.demoMode) {
        const idx = this.demo.logs.findIndex(
          (l) => l.employee_id === employeeId && l.date === dateStr
        );
        if (!newStatus) {
          if (idx >= 0) this.demo.logs.splice(idx, 1);
        } else {
          const entry = {
            id: Date.now(),
            employee_id: employeeId,
            date: dateStr,
            status: newStatus,
            created_at: new Date().toISOString(),
          };
          if (idx >= 0) this.demo.logs[idx] = entry;
          else this.demo.logs.push(entry);
        }
        this.showStatus('', '');
      } else {
        let result;
        if (!newStatus) {
          result = await window.supabase
            .from('attendance_logs')
            .delete()
            .eq('employee_id', employeeId)
            .eq('date', dateStr);
        } else {
          result = await window.supabase
            .from('attendance_logs')
            .upsert({
              employee_id: employeeId,
              date: dateStr,
              status: newStatus,
              created_at: new Date().toISOString(),
            });
        }

        if (result && result.error) throw result.error;
        this.showStatus('', '');
      }
    } catch (err) {
      console.error('toggleStatus error:', err);
      this.showStatus(
        'Could not update attendance: ' + (err && err.message ? err.message : err),
        'error'
      );
    } finally {
      btn.disabled = false;
      await this.renderGrid();
    }
  },

  async fetchEmployees() {
    if (this.demoMode) {
      return [...this.demo.employees].sort((a, b) =>
        String(a.name).localeCompare(String(b.name))
      );
    }
    const { data, error } = await window.supabase
      .from('employees')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async fetchLogs(year, monthIdx) {
    if (this.demoMode) {
      const month = String(monthIdx + 1).padStart(2, '0');
      const prefix = `${year}-${month}-`;
      return this.demo.logs.filter((l) => String(l.date).startsWith(prefix));
    }
    const month = String(monthIdx + 1).padStart(2, '0');
    const start = `${year}-${month}-01`;
    const end = `${year}-${month}-${new Date(year, monthIdx + 1, 0).getDate()}`;

    const { data, error } = await window.supabase
      .from('attendance_logs')
      .select('*')
      .gte('date', start)
      .lte('date', end);
    if (error) throw error;
    return data || [];
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());