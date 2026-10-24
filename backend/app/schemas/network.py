from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class NetworkNode(BaseModel):
    id: str = Field(..., description="Entity account identifier")
    label: str = Field(..., description="Display label for visualization")
    type: Literal["account", "external_entity", "flagged_mule"] = Field(
        default="account", description="Node entity classification"
    )
    riskScore: float = Field(..., ge=0, le=100, description="Risk index of account")
    balance: Optional[float] = Field(None, description="Current or estimated account balance")


class NetworkEdge(BaseModel):
    id: str = Field(..., description="Unique edge / transaction identifier")
    source: str = Field(..., description="Source account ID")
    target: str = Field(..., description="Destination account ID")
    amount: float = Field(..., description="Volume transferred")
    timestamp: str = Field(..., description="Transfer time")
    suspicious: bool = Field(default=False, description="Whether flagged as an anomalous hop")
    hopIndex: Optional[int] = Field(None, description="Distance from root account")


class AccountNetworkResponse(BaseModel):
    account_id: str = Field(..., description="Target account at center of graph query")
    nodes: List[NetworkNode] = Field(default_factory=list, description="All connected entity nodes")
    edges: List[NetworkEdge] = Field(default_factory=list, description="All flow edges between nodes")
    max_hops: int = Field(default=3, description="Depth radius searched")
    total_volume: float = Field(default=0.0, description="Cumulative flow across graph")
