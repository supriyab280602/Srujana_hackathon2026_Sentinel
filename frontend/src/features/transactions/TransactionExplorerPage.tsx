import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Transaction } from '../../types';
import { formatINR } from '../../utils/formatters';
import {
  Search,
  Filter,
  IndianRupee,
  Network,
  Zap,
  ShieldAlert,
  Plus,
  X
} from 'lucide-react';

export const TransactionExplorerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const accountFilter = searchParams.get('account') || '';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState(accountFilter);
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Live Simulation modal state
  const [showSimModal, setShowSimModal] = useState(false);
  const [simAmount, setSimAmount] = useState('145000');
  const [simSender, setSimSender] = useState('ACC-7749');
  const [simReceiver, setSimReceiver] = useState('ACC-9901');
  const [simChannel, setSimChannel] = useState<'wire' | 'crypto' | 'ach'>('crypto');
  const [simResult, setSimResult] = useState<any>(null);

  useEffect(() => {
    apiService.getTransactions().then((data) => {
      setTransactions(data);
      setLoading(false);
    });
  }, []);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await apiService.scoreTransaction({
      id: `TXN-SIM-${Date.now().toString().slice(-5)}`,
      sender_account_id: simSender,
      receiver_account_id: simReceiver,
      amount: parseFloat(simAmount),
      channel: simChannel,
      timestamp: new Date().toISOString(),
    });
    setSimResult(result);
    const newTxn: Transaction = {
      id: result.transaction_id,
      sender_account_id: simSender,
      receiver_account_id: simReceiver,
      amount: parseFloat(simAmount),
      currency: 'INR',
      channel: simChannel,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      risk_score: result.risk_score,
      risk_severity: result.severity,
      status: result.risk_score > 70 ? 'flagged' : 'cleared',
      flagged_rule: result.factors?.[0]?.name || 'SIMULATED_TEST'
    };
    setTransactions([newTxn, ...transactions]);
  };

  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      searchTerm === '' ||
      txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.sender_account_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.receiver_account_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesChannel =
      selectedChannel === 'all' || txn.channel.toLowerCase() === selectedChannel.toLowerCase();

    const matchesSeverity =
      selectedSeverity === 'all' || txn.risk_severity === selectedSeverity;

    return matchesSearch && matchesChannel && matchesSeverity;
  });

  const totalVolume = transactions.reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto pb-10">
      {/* Header & Simulation Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Transaction Surveillance &amp; Scorer
          </h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Real-time transaction telemetry, zero-lookahead risk attribution, and multi-hop channel routing
          </p>
        </div>

        <button
          onClick={() => setShowSimModal(true)}
          className="flex items-center gap-1.5 bg-brand-950 hover:bg-slate-800 text-white text-xs font-semibold py-2 px-3.5 rounded-lg shadow-xs transition-colors self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-blue-400" />
          <span>Simulate Incoming Transaction</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-surface-border rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center text-brand-700">
            <IndianRupee className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-ink-muted font-medium uppercase tracking-wider">Total Ledger Volume</div>
            <div className="text-lg font-bold text-ink tabular-nums mt-0.5">{formatINR(totalVolume)}</div>
          </div>
        </div>

        <div className="bg-surface border border-surface-border rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-risk-critical">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-ink-muted font-medium uppercase tracking-wider">Breached Alerts</div>
            <div className="text-lg font-bold text-risk-critical tabular-nums mt-0.5">
              {transactions.filter((t) => t.risk_severity === 'critical' || t.risk_severity === 'high').length} Flagged
            </div>
          </div>
        </div>

        <div className="bg-surface border border-surface-border rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-ink-muted font-medium uppercase tracking-wider">Inference Latency</div>
            <div className="text-lg font-bold text-ink font-mono tabular-nums mt-0.5">18 ms (p99)</div>
          </div>
        </div>

        <div className="bg-surface border border-surface-border rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center text-ink-secondary">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-ink-muted font-medium uppercase tracking-wider">Mapped Graph Nodes</div>
            <div className="text-lg font-bold text-ink tabular-nums mt-0.5">24 Active Accounts</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-surface border border-surface-border p-3.5 rounded-xl shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by Txn ID, Sender, Receiver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-elevated border border-surface-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-brand-500 font-sans"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-ink-muted" />
            <span className="text-ink-secondary font-medium text-[11px]">Channel:</span>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="bg-surface-elevated border border-surface-border rounded-lg px-2.5 py-1 text-xs text-ink font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Channels</option>
              <option value="wire">Wire</option>
              <option value="ach">ACH</option>
              <option value="crypto">Crypto</option>
              <option value="card">Card</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 ml-1">
            <span className="text-ink-secondary font-medium text-[11px]">Risk Tier:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-surface-elevated border border-surface-border rounded-lg px-2.5 py-1 text-xs text-ink font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Tiers</option>
              <option value="critical">Critical (&gt;80)</option>
              <option value="high">High (60-80)</option>
              <option value="medium">Medium (40-60)</option>
              <option value="low">Low (&lt;40)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="bg-surface border border-surface-border rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-ink">
            Surveillance Ledger Feed ({filteredTransactions.length})
          </h2>
          <span className="text-[11px] text-ink-muted font-mono">
            Showing filtered events
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-ink-muted">Loading ledger feed...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-ink-muted">No transactions match current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-border text-ink-muted font-semibold text-[11px] uppercase tracking-wider">
                  <th className="pb-2.5 font-medium">Txn ID</th>
                  <th className="pb-2.5 font-medium">Timestamp</th>
                  <th className="pb-2.5 font-medium">Sender Account</th>
                  <th className="pb-2.5 font-medium">Receiver Account</th>
                  <th className="pb-2.5 font-medium text-right">Amount (INR)</th>
                  <th className="pb-2.5 font-medium text-center">Rail</th>
                  <th className="pb-2.5 font-medium text-right">Risk Score</th>
                  <th className="pb-2.5 font-medium">Triggered Pattern</th>
                  <th className="pb-2.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredTransactions.map((txn) => {
                  const isCritical = (txn.risk_score || 0) >= 80;
                  const isHigh = (txn.risk_score || 0) >= 60;
                  const isMed = (txn.risk_score || 0) >= 40;

                  return (
                    <tr key={txn.id} className="hover:bg-surface-elevated/70 transition-colors group">
                      <td className="py-2.5 font-mono text-ink-secondary text-[11px] font-semibold whitespace-nowrap">
                        {txn.id}
                      </td>
                      <td className="py-2.5 text-ink-muted font-mono text-[11px] whitespace-nowrap">
                        {txn.timestamp}
                      </td>
                      <td className="py-2.5 font-mono text-[11px]">
                        <Link to={`/accounts/${txn.sender_account_id}`} className="font-semibold text-brand-700 hover:text-brand-900">
                          {txn.sender_account_id}
                        </Link>
                      </td>
                      <td className="py-2.5 font-mono text-[11px]">
                        <Link to={`/accounts/${txn.receiver_account_id}`} className="font-semibold text-brand-700 hover:text-brand-900">
                          {txn.receiver_account_id}
                        </Link>
                      </td>
                      <td className="py-2.5 text-right font-mono text-xs font-bold tabular-nums text-ink whitespace-nowrap">
                        {formatINR(txn.amount)}
                      </td>
                      <td className="py-2.5 text-center whitespace-nowrap">
                        <span className="uppercase text-[9px] font-mono font-bold text-ink-secondary px-1.5 py-0.5 rounded bg-surface-elevated border border-surface-border">
                          {txn.channel}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono text-xs font-semibold tabular-nums whitespace-nowrap">
                        <span className={isCritical ? 'text-risk-critical' : isHigh ? 'text-risk-high' : isMed ? 'text-risk-medium' : 'text-risk-low'}>
                          {txn.risk_score ? `${txn.risk_score}/100` : '—'}
                        </span>
                      </td>
                      <td className="py-2.5 text-ink-secondary text-xs max-w-xs truncate">
                        {txn.flagged_rule ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-red-50 text-red-800 border border-red-200">
                            {txn.flagged_rule}
                          </span>
                        ) : (
                          <span className="text-ink-muted text-[11px]">Normal Routine</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        <Link
                          to={`/network?account=${txn.sender_account_id}`}
                          title="Trace on Graph"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-secondary hover:text-ink bg-surface hover:bg-surface-elevated border border-surface-border px-2.5 py-1 rounded-md transition-colors shadow-xs"
                        >
                          <Network className="w-3 h-3 text-brand-600" />
                          <span>Trace</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Simulation Modal */}
      {showSimModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface rounded-xl border border-surface-border shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-600" />
                <h3 className="font-bold text-sm text-ink">Simulate Synthetic Transaction</h3>
              </div>
              <button
                onClick={() => { setShowSimModal(false); setSimResult(null); }}
                className="text-ink-muted hover:text-ink p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSimulate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-ink-secondary mb-1">Sender Account</label>
                <input
                  type="text"
                  value={simSender}
                  onChange={(e) => setSimSender(e.target.value)}
                  className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-1.5 font-mono text-ink focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-ink-secondary mb-1">Destination Account</label>
                <input
                  type="text"
                  value={simReceiver}
                  onChange={(e) => setSimReceiver(e.target.value)}
                  className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-1.5 font-mono text-ink focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink-secondary mb-1">Amount (INR ₹)</label>
                  <input
                    type="number"
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-1.5 font-mono text-ink focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-ink-secondary mb-1">Payment Rail</label>
                  <select
                    value={simChannel}
                    onChange={(e) => setSimChannel(e.target.value as any)}
                    className="w-full bg-surface-elevated border border-surface-border rounded-lg px-3 py-1.5 text-ink font-semibold focus:outline-none"
                  >
                    <option value="wire">WIRE (High-Value)</option>
                    <option value="crypto">CRYPTO (Offshore)</option>
                    <option value="ach">ACH (Domestic)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-brand-950 hover:bg-slate-800 text-white font-semibold py-2 px-4 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Score with Zero-Lookahead Engine</span>
              </button>
            </form>

            {simResult && (
              <div className="p-3.5 bg-surface-elevated border border-surface-border rounded-lg text-xs space-y-2 mt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">Inferred Risk Index:</span>
                  <span className={`font-mono font-bold text-sm ${simResult.risk_score > 70 ? 'text-risk-critical' : 'text-risk-low'}`}>
                    {simResult.risk_score} / 100
                  </span>
                </div>
                <div className="text-[11px] text-ink-secondary">
                  Confidence: <span className="font-mono font-bold">{Math.round((simResult.confidence || 0.85) * 100)}%</span>
                </div>
                {simResult.factors && simResult.factors.length > 0 && (
                  <div className="pt-2 border-t border-surface-border text-[11px] text-ink-secondary space-y-1">
                    <span className="font-semibold text-ink block">Top Attribution Factors:</span>
                    {simResult.factors.map((f: any, i: number) => (
                      <div key={i} className="flex justify-between text-[10px]">
                        <span>• {f.name}</span>
                        <span className="font-mono font-bold text-amber-700">+{f.contribution}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
