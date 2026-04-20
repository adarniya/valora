import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { agingService } from '../../services/agingService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { AlertTriangle, Clock, ShieldOff, ChevronDown, ChevronUp, Search } from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────

const STATUS_META = {
  active:    { label: 'Active',    color: 'bg-green-100 text-green-700',  border: 'border-green-200',  icon: Clock      },
  overaging: { label: 'Overaging', color: 'bg-amber-100 text-amber-700',  border: 'border-amber-200',  icon: AlertTriangle },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-700',      border: 'border-red-200',    icon: ShieldOff  },
};

const StatusBadge = ({ status, small = false }) => {
  const meta = STATUS_META[status] || STATUS_META.active;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${meta.color} ${small ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}`}>
      <Icon className={small ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {meta.label}
    </span>
  );
};

const DayBar = ({ days, status }) => {
  const pct = Math.min(100, Math.round((days / 30) * 100));
  const barColor =
    status === 'suspended'  ? 'bg-red-500' :
    status === 'overaging'  ? 'bg-amber-500' :
                              'bg-green-500';
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-700 w-8 text-right">{days}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden min-w-[48px]">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const initials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase();

const avatarBg = {
  active:    'bg-green-100 text-green-700',
  overaging: 'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
};

// ─── main component ──────────────────────────────────────────────────────────

const AgingReport = () => {
  const { user } = useAuth();

  const isCustomer = [5, 6].includes(user?.role_id);

  const [customers, setCustomers]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState(isCustomer ? (user?.username ?? '') : '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded]     = useState({});
  const [sortField, setSortField]   = useState('customer_name');
  const [sortDir, setSortDir]       = useState('asc');

  // fetch once on mount
  useEffect(() => {
    const fetchAging = async () => {
      try {
        setLoading(true);
        const response = await agingService.getAgingReport();
        if (response.success) {
          setCustomers(response.data);
        } else {
          setError('Failed to load aging report.');
        }
      } catch (err) {
        setError('Failed to load aging report.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAging();
  }, []);

  // auto-expand for customers once data loads
  useEffect(() => {
    if (isCustomer && customers.length > 0) {
      const expandAll = {};
      customers.forEach(c => { expandAll[c.user_id] = true; });
      setExpanded(expandAll);
    }
  }, [customers]);

  // ── summary counts — always scoped to what this user can see ──────────
  const summary = useMemo(() => {
    let totalBalance = 0, active = 0, overaging = 0, suspended = 0;
    customers.forEach((c) => {
      totalBalance += c.total_balance;
      if (c.status === 'active')         active++;
      else if (c.status === 'overaging') overaging++;
      else if (c.status === 'suspended') suspended++;
    });
    return { totalBalance, active, overaging, suspended };
  }, [customers]);

  // ── filtering + sorting ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = customers.filter((c) => {
      const matchSearch =
        c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        c.customer_username.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });

    list = [...list].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 :  1;
      if (aVal > bVal) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });

    return list;
  }, [customers, search, statusFilter, sortField, sortDir]);

  const toggleExpand = (userId) =>
    setExpanded((prev) => ({ ...prev, [userId]: !prev[userId] }));

  const handleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-blue-600 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  // ── render ──────────────────────────────────────────────────────────────

  if (loading) return <div className="text-center py-12 text-gray-500">Loading aging report…</div>;
  if (error)   return <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto">

      {/* ── page header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Aging Report</h1>
          <p className="text-sm text-gray-500 mt-1">As of {formatDate(new Date().toISOString().split('T')[0])}</p>
        </div>
      </div>

      {/* ── summary cards — hidden for customers ── */}
      {!isCustomer && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-xs text-gray-500 mb-1">Total Outstanding</p>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(summary.totalBalance)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-xs text-gray-500 mb-1">Active</p>
            <p className="text-xl font-bold text-green-600">{summary.active}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-xs text-gray-500 mb-1">Overaging</p>
            <p className="text-xl font-bold text-amber-500">{summary.overaging}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-xs text-gray-500 mb-1">Suspended</p>
            <p className="text-xl font-bold text-red-500">{summary.suspended}</p>
          </div>
        </div>
      )}

      {/* ── filters ── */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => !isCustomer && setSearch(e.target.value)}
            readOnly={isCustomer}
            placeholder="Search customer…"
            className={`w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isCustomer ? 'bg-gray-50 cursor-not-allowed text-gray-500' : 'bg-white'}`}
          />
        </div>

        {/* status filter — hidden for customers */}
        {!isCustomer && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="overaging">Overaging</option>
            <option value="suspended">Suspended</option>
          </select>
        )}

        {/* sort — hidden for customers */}
        {!isCustomer && (
          <select
            value={`${sortField}_${sortDir}`}
            onChange={(e) => {
              const [f, d] = e.target.value.split('_');
              setSortField(f); setSortDir(d);
            }}
            className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="customer_name_asc">Name A→Z</option>
            <option value="customer_name_desc">Name Z→A</option>
            <option value="total_balance_desc">Balance ↓</option>
            <option value="total_balance_asc">Balance ↑</option>
          </select>
        )}
      </div>

      {/* ── customer list ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">No customers match your filters.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((customer) => {
            const isOpen = !!expanded[customer.user_id];
            const meta   = STATUS_META[customer.status] || STATUS_META.active;

            return (
              <div
                key={customer.user_id}
                className={`bg-white rounded-lg border shadow-sm overflow-hidden ${meta.border}`}
              >
                {/* customer row — clickable to expand */}
                <button
                  onClick={() => toggleExpand(customer.user_id)}
                  className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${avatarBg[customer.status]}`}>
                        {initials(customer.customer_name)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{customer.customer_name}</p>
                        <p className="text-xs text-gray-500">{customer.customer_username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 flex-wrap">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Outstanding</p>
                        <p className="text-sm font-bold text-gray-800">{formatCurrency(customer.total_balance)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Bills</p>
                        <p className="text-sm font-semibold text-gray-800">{customer.bills.length}</p>
                      </div>
                      <StatusBadge status={customer.status} />
                      {isOpen
                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>
                </button>

                {/* expanded bill table */}
                {isOpen && (
                  <div className="border-t overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-600">Bill No.</th>
                          <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-600">
                            <button onClick={() => handleSort('bill_date')} className="hover:text-blue-600">
                              Bill Date <SortIcon field="bill_date" />
                            </button>
                          </th>
                          <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-600">Invoice</th>
                          <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-600">Paid</th>
                          <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-600">Balance</th>
                          <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-600">Days</th>
                          <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customer.bills.map((bill, idx) => (
                          <tr key={bill.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-5 py-2.5 font-semibold text-gray-800">{bill.bill_number}</td>
                            <td className="px-5 py-2.5 text-gray-600">{formatDate(bill.bill_date)}</td>
                            <td className="px-5 py-2.5 text-right text-gray-800">{formatCurrency(bill.invoice_amount)}</td>
                            <td className="px-5 py-2.5 text-right text-green-600 font-medium">{formatCurrency(bill.total_paid)}</td>
                            <td className="px-5 py-2.5 text-right font-bold text-gray-800">{formatCurrency(bill.balance)}</td>
                            <td className="px-5 py-2.5">
                              <DayBar days={bill.days_outstanding} status={bill.status} />
                            </td>
                            <td className="px-5 py-2.5">
                              <StatusBadge status={bill.status} small />
                            </td>
                          </tr>
                        ))}
                        {/* totals row */}
                        <tr className="bg-gray-100 font-semibold border-t">
                          <td className="px-5 py-2.5 text-gray-700" colSpan={2}>Total</td>
                          <td className="px-5 py-2.5 text-right text-gray-800">{formatCurrency(customer.total_invoice)}</td>
                          <td className="px-5 py-2.5 text-right text-green-600">{formatCurrency(customer.total_paid)}</td>
                          <td className="px-5 py-2.5 text-right text-gray-800">{formatCurrency(customer.total_balance)}</td>
                          <td colSpan={2} />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AgingReport;