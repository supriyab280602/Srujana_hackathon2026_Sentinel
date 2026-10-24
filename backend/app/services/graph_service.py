import networkx as nx
from typing import Dict, Any, List
from app.schemas.network import AccountNetworkResponse
from app.repositories.base import repo


class GraphService:
    """
    Manages transaction network graph construction and NetworkX topological analysis.
    Used for multi-hop path tracing, circular cycle detection, and mule community detection.
    """

    def build_networkx_graph(self, network_data: AccountNetworkResponse) -> nx.DiGraph:
        G = nx.DiGraph()
        for node in network_data.nodes:
            G.add_node(node.id, label=node.label, risk_score=node.riskScore, type=node.type)

        for edge in network_data.edges:
            G.add_edge(edge.source, edge.target, id=edge.id, amount=edge.amount, suspicious=edge.suspicious)

        return G

    def get_account_network(self, account_id: str) -> AccountNetworkResponse:
        network_data = repo.get_account_network(account_id)
        return network_data

    def detect_cycles(self, network_data: AccountNetworkResponse) -> List[List[str]]:
        """Finds circular routing / layering loops using NetworkX simple cycles."""
        G = self.build_networkx_graph(network_data)
        try:
            return list(nx.simple_cycles(G))
        except Exception:
            return []


graph_service = GraphService()
