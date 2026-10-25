import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiService } from '../../services/api';
import { Transaction } from '../../types';
import {
  Search,
  Filter,
  DollarSign,
  Network,
  Zap,
  ShieldAlert,
  Plus,
  CheckCircle2,
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

  // Live Simulation state
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
      currency: 'USD',
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
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* Header & Simulation Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Transaction Explorer &amp; Scorer
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Global ledger surveillance feed, continuous zero-lookahead feature extraction, and ML score attribution
          </p>
        </div>

        <button
          onClick={() => setShowSimModal(true)}
          className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold py-3 px-5 rounded-full shadow-xs transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Simulate Incoming Transaction</span>
        </button>
      </div>

      {/* KPI Cards (Matches Reference Soft Rounded Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#f7f8fa] border border-neutral-100 rounded-3xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-neutral-200/60 flex items-center justify-center text-blue-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-neutral-400 font-medium">Total Monitored Volume</div>
            <div className="text-xl font-bold text-neutral-900 mt-0.5">${(totalVolume / 1000).toFixed(0)}k USD</div>
          </div>
        </div>

        <div className="bg-[#f7f8fa] border border-neutral-100 rounded-3xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-neutral-200/60 flex items-center justify-center text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-neutral-400 font-medium">Critical / Flagged Txns</div>
            <div className="text-xl font-bold text-rose-600 mt-0.5">
              {transactions.filter((t) => t.risk_severity === 'critical' || t.risk_severity === 'high').length} Breached
            </div>
          </div>
        </div>

        <div className="bg-[#f7f8fa] border border-neutral-100 rounded-3xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-neutral-200/60 flex items-center justify-center text-emerald-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-neutral-400 font-medium">Scoring Latency (p99)</div>
            <div className="text-xl font-bold text-neutral-900 mt-0.5">18 ms Real-Time</div>
          </div>
        </div>

        <div className="bg-[#f7f8fa] border border-neutral-100 rounded-3xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-neutral-200/60 flex items-center justify-center text-neutral-700">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-neutral-400 font-medium">Network Entities</div>
            <div className="text-xl font-bold text-neutral-900 mt-0.5">24 Mapped Nodes</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-neutral-100 p-4 rounded-3xl shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by Txn ID, Sender, Receiver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#f4f5f7] border-0 rounded-full pl-10 pr-4 py-2 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-neutral-500 font-medium">Channel:</span>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="bg-neutral-50 border border-neutral-200/80 rounded-full px-3 py-1.5 text-xs text-neutral-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">ALL CHANNELS</option>
              <option value="wire">WIRE</option>
              <option value="ach">ACH</option>
              <option value="crypto">CRYPTO</option>
              <option value="card">CARD</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-2">
            <span className="text-neutral-500 font-medium">Risk Tier:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-neutral-50 border border-neutral-200/80 rounded-full px-3 py-1.5 text-xs text-neutral-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">ALL SEVERITIES</option>
              <option value="critical">CRITICAL</option>
              <option value="high">HIGH</option>
              <option value="medium">MEDIUM</option>
              <option value="low">LOW</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="bg-white border border-neutral-100 rounded-3xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-neutral-900 mb-4">
          Surveillance Ledger Feed ({filteredTransactions.length})
        </h2>

        {loading ? (
          <div className="p-8 text-center text-xs text-neutral-400">Loading ledger feed...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">No transactions match current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 font-medium">
                  <th className="pb-3 font-medium">Txn ID</th>
                  <th className="pb-3 font-medium">Timestamp</th>
                  <th className="pb-3 font-medium">Sender</th>
                  <th className="pb-3 font-medium">Receiver</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Channel</th>
                  <th className="pb-3 font-medium">Risk Score</th>
                  <th className="pb-3 font-medium">Pattern</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {filteredTransactions.map((txn) => {
                  const isHighRisk = (txn.risk_score || 0) >= 80;
                  const isMedRisk = (txn.risk_score || 0) >= 50;
                  return (
                    <tr key={txn.id} className="hover:bg-neutral-50/60 transition-colors group">
                      <td className="py-3.5 font-semibold text-neutral-900">{txn.id}</td>
                      <td className="py-3.5 text-neutral-400 font-medium text-[11px]">{txn.timestamp}</td>
                      <td className="py-3.5">
                        <Link to={`/accounts/${txn.sender_account_id}`} className="font-medium text-neutral-700 hover:text-blue-600">
                          {txn.sender_account_id}
                        </Link>
                      </td>
                      <td className="py-3.5">
                        <Link to={`/accounts/${txn.receiver_account_id}`} className="font-medium text-neutral-700 hover:text-blue-600">
                          {txn.receiver_account_id}
                        </Link>
                      </td>
                      <td className="py-3.5 font-bold text-neutral-900">
                        ${txn.amount.toLocaleString()} <span className="text-neutral-400 text-[10px] font-normal">{txn.currency}</span>
                      </td>
                      <td className="py-3.5 uppercase text-[10px] text-neutral-500 font-medium">{txn.channel}</td>
                      <td className="py-3.5">
                        {txn.risk_score ? (
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                            isHighRisk ? 'text-rose-600' : isMedRisk ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              isHighRisk ? 'bg-rose-500' : isMedRisk ? 'bg-amber-400' : 'bg-emerald-500'
                            }`} />
                            {txn.risk_score}/100
                          </span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 text-neutral-600 max-w-xs truncate">
                        {txn.flagged_rule ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-medium text-[10px]">
                            {txn.flagged_rule}
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-[10px]">Normal Baseline</span>
                        )}
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          to={`/network?account=${txn.sender_account_id}`}
                          title="Trace on Graph"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 px-3 py-1.5 rounded-full transition-colors shadow-xs"
                        >
                          <Network className="w-3 h-3 text-neutral-400" />
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

      {/* Simulation Modal with Goodfolio Rounded-3xl Card */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-100 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                Live Zero-Lookahead Risk Scorer
              </h3>
              <button
                onClick={() => { setShowSimModal(false); setSimResult(null); }}
                className="text-neutral-400 hover:text-neutral-900 p-1 rounded-full hover:bg-neutral-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSimulate} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Sender Account ID</label>
                <input
                  type="text"
                  value={simSender}
                  onChange={(e) => setSimSender(e.target.value)}
                  className="w-full bg-[#f4f5f7] border-0 rounded-2xl p-3 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Receiver Account ID</label>
                <input
                  type="text"
                  value={simReceiver}
                  onChange={(e) => setSimReceiver(e.target.value)}
                  className="w-full bg-[#f4f5f7] border-0 rounded-2xl p-3 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Amount (USD)</label>
                  <input
                    type="number"
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    className="w-full bg-[#f4f5f7] border-0 rounded-2xl p-3 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Payment Rail</label>
                  <select
                    value={simChannel}
                    onChange={(e: any) => setSimChannel(e.target.value)}
                    className="w-full bg-[#f4f5f7] border-0 rounded-2xl p-3 text-xs text-neutral-900 uppercase focus:outline-none focus:ring-2 focus:ring-neutral-300"
                  >
                    <option value="wire">WIRE</option>
                    <option value="crypto">CRYPTO</option>
                    <option value="ach">ACH</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  Score Transaction Under Zero-Lookahead Model
                </button>
              </div>
            </form>

            {simResult && (
              <div className="p-4 rounded-2xl bg-[#f7f8fa] border border-neutral-100 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-200/60">
                  <span className="text-neutral-500 font-medium">Scored Risk Index:</span>
                  <span className="font-bold text-sm text-rose-600">
                    {simResult.risk_score} / 100 ({simResult.severity.toUpperCase()})
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-neutral-400 block mb-1">Attributed Risk Factors:</span>
                  {simResult.factors.map((f: any, i: number) => (
                    <div key={i} className="text-neutral-700 flex justify-between py-0.5">
                      <span>• {f.name}</span>
                      <span className="text-rose-600 font-bold">+{f.contribution} pts</span>
                    </div>
                  ))}
                </div>
                <div className="pt-1 flex items-center gap-1.5 text-emerald-700 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Injected into active ledger feed. Zero-lookahead integrity preserved.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
