import networkx as nx
from typing import Dict, Any, List, Optional, Set
from app.schemas.network import AccountNetworkResponse, NetworkNode, NetworkEdge
from app.schemas.transaction import TransactionRead
from app.services.transaction_service import transaction_service, normalize_to_utc
from app.services.alert_service import alert_service


class GraphService:
    """
    Manages transaction network graph construction and NetworkX topological analysis.
    Constructs multi-hop relationship graphs directly from Sentinel's persisted transaction ledger
    and provides zero-lookahead chronological replay by filtering transactions as of replay steps.
    """

    def build_networkx_graph(self, network_data: AccountNetworkResponse) -> nx.DiGraph:
        """Constructs a NetworkX directed graph from node and edge definitions."""
        G = nx.DiGraph()
        for node in network_data.nodes:
            G.add_node(
                node.id,
                label=node.label,
                risk_score=node.riskScore,
                node_type=node.type,
                balance=node.balance,
            )

        for edge in network_data.edges:
            G.add_edge(
                edge.source,
                edge.target,
                id=edge.id,
                amount=edge.amount,
                suspicious=edge.suspicious,
                timestamp=edge.timestamp,
                step_index=edge.step_index,
                channel=getattr(edge, "channel", None),
            )

        return G

    def detect_cycles(self, network_data: AccountNetworkResponse) -> List[List[str]]:
        """Finds circular routing / layering loops using NetworkX simple cycles."""
        G = self.build_networkx_graph(network_data)
        try:
            return list(nx.simple_cycles(G))
        except Exception:
            return []

    def get_account_network(
        self, account_id: str, max_hops: int = 3, as_of_step: Optional[int] = None
    ) -> AccountNetworkResponse:
        """
        Retrieves graph topology derived from persisted ledger transactions up to max_hops,
        optionally bounded by as_of_step for zero-lookahead chronological replay,
        and computes NetworkX topological analysis on the active replay graph.
        """
        all_txns: List[TransactionRead] = transaction_service.get_all_transactions()
        alerts = alert_service.list_alerts()
        alerted_txn_ids: Set[str] = {a.transaction_id for a in alerts if a.transaction_id}
        account_alerts: Dict[str, Any] = {a.account_id: a for a in alerts}

        # Deterministic chronological ordering with stable tie-breaker (transaction ID)
        sorted_all_txns = sorted(
            all_txns,
            key=lambda t: (normalize_to_utc(t.timestamp), t.id)
        )

        # Chronological causal evolution of account_id's multi-hop network
        # Transactions are only admitted when connected to the active network within max_hops
        # at the time the transaction occurs, preventing future transactions from leaking backwards.
        node_hops: Dict[str, int] = {account_id: 0}
        admitted_txns: List[TransactionRead] = []

        for t in sorted_all_txns:
            # If as_of_step bound is reached, stop evaluating subsequent transactions
            if as_of_step is not None and len(admitted_txns) >= as_of_step:
                break

            src = t.sender_account_id
            dst = t.receiver_account_id

            src_hop = node_hops.get(src)
            dst_hop = node_hops.get(dst)

            is_connected = False

            if src_hop is not None and dst_hop is not None:
                # Both endpoints are already in the active network
                if src_hop + 1 < dst_hop and src_hop < max_hops:
                    node_hops[dst] = src_hop + 1
                elif dst_hop + 1 < src_hop and dst_hop < max_hops:
                    node_hops[src] = dst_hop + 1
                is_connected = True
            elif src_hop is not None and src_hop < max_hops:
                # Transaction expands active network to dst
                node_hops[dst] = src_hop + 1
                is_connected = True
            elif dst_hop is not None and dst_hop < max_hops:
                # Transaction expands active network to src
                node_hops[src] = dst_hop + 1
                is_connected = True

            if is_connected:
                admitted_txns.append(t)

        # Build NetworkEdge list with 1-based chronological step_index
        all_edges: List[NetworkEdge] = []
        for step_idx, t in enumerate(admitted_txns, start=1):
            src = t.sender_account_id
            dst = t.receiver_account_id
            hop_idx = max(1, max(node_hops.get(src, 1), node_hops.get(dst, 1)))
            ts_str = t.timestamp.isoformat() if hasattr(t.timestamp, "isoformat") else str(t.timestamp)
            all_edges.append(
                NetworkEdge(
                    id=t.id,
                    source=src,
                    target=dst,
                    amount=float(t.amount),
                    timestamp=ts_str,
                    suspicious=t.id in alerted_txn_ids,
                    hopIndex=hop_idx,
                    step_index=step_idx,
                    channel=t.channel,
                )
            )

        # Build NetworkNode list for all active nodes
        active_node_ids = {e.source for e in all_edges} | {e.target for e in all_edges} | {account_id}
        active_nodes: List[NetworkNode] = []
        for node_id in sorted(active_node_ids, key=lambda n: (node_hops.get(n, 0), n)):
            alert = account_alerts.get(node_id)
            risk_score = float(alert.risk_score) if alert else 0.0
            node_type = "account"
            if alert and (alert.detection_rule == "CROSS_ACCOUNT_FANOUT_BURST" or "mule" in alert.summary.lower()):
                node_type = "flagged_mule"

            label = f"{node_id} (Target)" if node_id == account_id else node_id
            active_nodes.append(
                NetworkNode(
                    id=node_id,
                    label=label,
                    type=node_type,
                    riskScore=risk_score,
                    balance=None,
                )
            )

        active_edges = all_edges
        total_vol = float(sum(e.amount for e in active_edges))

        # Build a temporary response to run NetworkX analysis strictly on active edges
        temp_data = AccountNetworkResponse(
            account_id=account_id,
            nodes=active_nodes,
            edges=active_edges,
            max_hops=max_hops,
            total_volume=total_vol,
        )

        detected_cycles = self.detect_cycles(temp_data)
        G = self.build_networkx_graph(temp_data)

        metrics = {
            "node_count": len(active_nodes),
            "edge_count": len(active_edges),
            "suspicious_edge_count": sum(1 for e in active_edges if e.suspicious),
            "current_replay_step": as_of_step,
            "has_cycles": len(detected_cycles) > 0,
            "in_degree": dict(G.in_degree()),
            "out_degree": dict(G.out_degree()),
        }

        return AccountNetworkResponse(
            account_id=account_id,
            nodes=active_nodes,
            edges=active_edges,
            max_hops=max_hops,
            total_volume=total_vol,
            detected_cycles=detected_cycles,
            metrics=metrics,
        )


graph_service = GraphService()
