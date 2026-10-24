def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "sentinel-core"
    assert "timestamp" in data


def test_list_alerts(client):
    response = client.get("/api/alerts")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "risk_score" in data[0]
    assert "factors" in data[0]


def test_get_alert_by_id(client):
    response = client.get("/api/alerts/ALT-8902")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "ALT-8902"
    assert data["severity"] == "critical"
    assert data["risk_score"] == 94.0


def test_get_alert_not_found(client):
    response = client.get("/api/alerts/NON-EXISTENT")
    assert response.status_code == 404


def test_get_account_network(client):
    response = client.get("/api/accounts/ACC-7749/network")
    assert response.status_code == 200
    data = response.json()
    assert data["account_id"] == "ACC-7749"
    assert len(data["nodes"]) >= 2
    assert len(data["edges"]) >= 1


def test_score_transaction(client):
    payload = {
        "transaction": {
            "sender_account_id": "ACC-TEST-1",
            "receiver_account_id": "ACC-TEST-2",
            "amount": 25000.0,
            "currency": "USD",
            "channel": "crypto",
            "location_country": "US",
        },
        "account_history_lookback_days": 30,
        "include_graph_context": True,
    }
    response = client.post("/api/transactions/score", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "risk_score" in data
    assert data["risk_score"] > 0
    assert "factors" in data
    assert data["confidence"] > 0


def test_investigation_review(client):
    payload = {
        "alert_id": "ALT-8902",
        "decision": "confirm_fraud",
        "notes": "Verified fan-out burst matches known mule pattern.",
        "investigator_id": "INV-TEST-01",
        "tags": ["fanout", "confirmed_mule"],
    }
    response = client.post("/api/investigations/ALT-8902/review", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["alert_id"] == "ALT-8902"
    assert data["decision"] == "confirm_fraud"
    assert "review_id" in data
