from datetime import datetime, timezone, timedelta
import pytest
from unittest.mock import patch

from app.schemas.transaction import TransactionRead, TransactionCreate
from app.schemas.scoring import ScoreRequest
from app.repositories.base import repo
from app.services.transaction_service import transaction_service, normalize_to_utc
from app.services.scoring_service import scoring_service


# Fixed reference time for deterministic testing: 2026-10-24 15:00:00 UTC
BASE_TIME = datetime(2026, 10, 24, 15, 0, 0, tzinfo=timezone.utc)
TARGET_ACCOUNT = "ACC-TARGET"


def create_mock_tx(tx_id: str, sender: str, receiver: str, amount: float, ts: datetime) -> TransactionRead:
    return TransactionRead(
        id=tx_id,
        sender_account_id=sender,
        receiver_account_id=receiver,
        amount=amount,
        currency="USD",
        channel="wire",
        timestamp=ts,
    )


@pytest.fixture(autouse=True)
def restore_repo_transactions():
    """Ensure repo transaction store is clean/restored after each test."""
    initial_txns = dict(repo._transactions)
    yield
    repo.reset_transactions(initial_txns)


def test_one_hour_window_inside_and_outside():
    """
    Test 1: Transactions inside and outside the one-hour window.
    - Inside: 15 min and 45 min before as_of_timestamp.
    - Outside: 90 min before as_of_timestamp (within lookback).
    """
    txns = {
        "TX-1": create_mock_tx("TX-1", TARGET_ACCOUNT, "ACC-A", 1000.0, BASE_TIME - timedelta(minutes=15)),
        "TX-2": create_mock_tx("TX-2", TARGET_ACCOUNT, "ACC-B", 2500.0, BASE_TIME - timedelta(minutes=45)),
        "TX-3": create_mock_tx("TX-3", TARGET_ACCOUNT, "ACC-C", 5000.0, BASE_TIME - timedelta(minutes=90)),
    }
    repo.reset_transactions(txns)

    context = transaction_service.get_account_activity_context(
        TARGET_ACCOUNT, as_of_timestamp=BASE_TIME, lookback_days=7
    )

    # Only TX-1 and TX-2 fall within (BASE_TIME - 1 hour, BASE_TIME)
    assert context["velocity_1h_count"] == 2.0
    assert context["velocity_1h_volume"] == 3500.0
    assert context["unique_destinations_1h"] == 2.0

    # TX-3 is included in the 7-day lookback
    assert context["historical_tx_count"] == 3
    assert context["historical_total_volume"] == 8500.0


def test_lookback_days_window_inside_and_outside():
    """
    Test 2: Transactions inside and outside lookback_days window.
    - Lookback: 7 days.
    - Inside: 3 days and 6 days before as_of_timestamp.
    - Outside: 8 days before as_of_timestamp.
    """
    txns = {
        "TX-1": create_mock_tx("TX-1", TARGET_ACCOUNT, "ACC-A", 1200.0, BASE_TIME - timedelta(days=3)),
        "TX-2": create_mock_tx("TX-2", TARGET_ACCOUNT, "ACC-B", 1800.0, BASE_TIME - timedelta(days=6)),
        "TX-3": create_mock_tx("TX-3", TARGET_ACCOUNT, "ACC-C", 9000.0, BASE_TIME - timedelta(days=8)),
    }
    repo.reset_transactions(txns)

    context = transaction_service.get_account_activity_context(
        TARGET_ACCOUNT, as_of_timestamp=BASE_TIME, lookback_days=7
    )

    # None in 1-hour window
    assert context["velocity_1h_count"] == 0.0
    assert context["velocity_1h_volume"] == 0.0

    # Only TX-1 and TX-2 fall within (BASE_TIME - 7 days, BASE_TIME)
    assert context["historical_tx_count"] == 2
    assert context["historical_total_volume"] == 3000.0
    assert context["lookback_days"] == 7


def test_exact_cutoffs_are_excluded():
    """
    Test 3: Transactions exactly at the one-hour cutoff and exactly at the longer-term cutoff.
    Both exact boundary timestamps must be excluded by strict inequality (> cutoff).
    """
    one_hour_cutoff = BASE_TIME - timedelta(hours=1)
    seven_day_cutoff = BASE_TIME - timedelta(days=7)

    txns = {
        # Exactly at 1-hour cutoff: excluded from 1h, but inside 7-day lookback
        "TX-EXACT-1H": create_mock_tx("TX-EXACT-1H", TARGET_ACCOUNT, "ACC-A", 1000.0, one_hour_cutoff),
        # 1 millisecond inside 1-hour window: included in 1h
        "TX-JUST-INSIDE-1H": create_mock_tx("TX-JUST-INSIDE-1H", TARGET_ACCOUNT, "ACC-B", 2000.0, one_hour_cutoff + timedelta(milliseconds=1)),
        # Exactly at 7-day cutoff: excluded from 7-day lookback
        "TX-EXACT-7D": create_mock_tx("TX-EXACT-7D", TARGET_ACCOUNT, "ACC-C", 4000.0, seven_day_cutoff),
        # 1 millisecond inside 7-day lookback: included in 7-day lookback
        "TX-JUST-INSIDE-7D": create_mock_tx("TX-JUST-INSIDE-7D", TARGET_ACCOUNT, "ACC-D", 5000.0, seven_day_cutoff + timedelta(milliseconds=1)),
    }
    repo.reset_transactions(txns)

    context = transaction_service.get_account_activity_context(
        TARGET_ACCOUNT, as_of_timestamp=BASE_TIME, lookback_days=7
    )

    # 1-hour window: TX-EXACT-1H is excluded, TX-JUST-INSIDE-1H is included
    assert context["velocity_1h_count"] == 1.0
    assert context["velocity_1h_volume"] == 2000.0

    # 7-day lookback: TX-EXACT-7D is excluded, other 3 are included
    assert context["historical_tx_count"] == 3
    assert context["historical_total_volume"] == 1000.0 + 2000.0 + 5000.0


def test_transactions_at_as_of_timestamp_are_excluded():
    """
    Test 4: Transactions exactly at as_of_timestamp must be excluded.
    Prevents self-inclusion and zero-lookahead temporal leakage.
    """
    txns = {
        "TX-PRIOR": create_mock_tx("TX-PRIOR", TARGET_ACCOUNT, "ACC-A", 1500.0, BASE_TIME - timedelta(seconds=1)),
        "TX-EXACT": create_mock_tx("TX-EXACT", TARGET_ACCOUNT, "ACC-B", 9999.0, BASE_TIME),
    }
    repo.reset_transactions(txns)

    context = transaction_service.get_account_activity_context(
        TARGET_ACCOUNT, as_of_timestamp=BASE_TIME, lookback_days=1
    )

    assert context["velocity_1h_count"] == 1.0
    assert context["velocity_1h_volume"] == 1500.0
    assert context["historical_tx_count"] == 1
    assert context["historical_total_volume"] == 1500.0


def test_future_dated_transactions_are_excluded():
    """
    Test 5: Future-dated transactions (t > as_of_timestamp) must be strictly excluded.
    """
    txns = {
        "TX-PAST": create_mock_tx("TX-PAST", TARGET_ACCOUNT, "ACC-A", 800.0, BASE_TIME - timedelta(minutes=10)),
        "TX-FUTURE-1": create_mock_tx("TX-FUTURE-1", TARGET_ACCOUNT, "ACC-B", 50000.0, BASE_TIME + timedelta(seconds=1)),
        "TX-FUTURE-2": create_mock_tx("TX-FUTURE-2", TARGET_ACCOUNT, "ACC-C", 75000.0, BASE_TIME + timedelta(days=2)),
    }
    repo.reset_transactions(txns)

    context = transaction_service.get_account_activity_context(
        TARGET_ACCOUNT, as_of_timestamp=BASE_TIME, lookback_days=30
    )

    assert context["velocity_1h_count"] == 1.0
    assert context["velocity_1h_volume"] == 800.0
    assert context["historical_tx_count"] == 1
    assert context["historical_total_volume"] == 800.0


def test_incoming_vs_outgoing_transfers():
    """
    Test 6: Incoming transfers to TARGET_ACCOUNT must not count toward outgoing velocity or volume.
    """
    txns = {
        # Outgoing from TARGET_ACCOUNT: should be counted
        "TX-OUT-1": create_mock_tx("TX-OUT-1", TARGET_ACCOUNT, "ACC-RECIPIENT", 2000.0, BASE_TIME - timedelta(minutes=20)),
        # Incoming to TARGET_ACCOUNT: should be IGNORED
        "TX-IN-1": create_mock_tx("TX-IN-1", "ACC-SENDER-EXTERNAL", TARGET_ACCOUNT, 100000.0, BASE_TIME - timedelta(minutes=15)),
        # Incoming to TARGET_ACCOUNT in lookback: should be IGNORED
        "TX-IN-2": create_mock_tx("TX-IN-2", "ACC-SENDER-EXTERNAL", TARGET_ACCOUNT, 50000.0, BASE_TIME - timedelta(days=2)),
    }
    repo.reset_transactions(txns)

    context = transaction_service.get_account_activity_context(
        TARGET_ACCOUNT, as_of_timestamp=BASE_TIME, lookback_days=7
    )

    assert context["velocity_1h_count"] == 1.0
    assert context["velocity_1h_volume"] == 2000.0
    assert context["unique_destinations_1h"] == 1.0
    assert context["historical_tx_count"] == 1
    assert context["historical_total_volume"] == 2000.0


def test_one_hour_count_volume_and_unique_destinations():
    """
    Test 7: Verify unique destination deduplication and volume summation within the 1-hour window.
    """
    txns = {
        "TX-1": create_mock_tx("TX-1", TARGET_ACCOUNT, "ACC-DEST-A", 1000.0, BASE_TIME - timedelta(minutes=10)),
        "TX-2": create_mock_tx("TX-2", TARGET_ACCOUNT, "ACC-DEST-B", 2000.0, BASE_TIME - timedelta(minutes=20)),
        "TX-3": create_mock_tx("TX-3", TARGET_ACCOUNT, "ACC-DEST-A", 3000.0, BASE_TIME - timedelta(minutes=30)),  # Repeated destination
        "TX-4": create_mock_tx("TX-4", TARGET_ACCOUNT, "ACC-DEST-C", 4000.0, BASE_TIME - timedelta(minutes=40)),
    }
    repo.reset_transactions(txns)

    context = transaction_service.get_account_activity_context(
        TARGET_ACCOUNT, as_of_timestamp=BASE_TIME, lookback_days=1
    )

    assert context["velocity_1h_count"] == 4.0
    assert context["velocity_1h_volume"] == 10000.0
    # 4 transactions disbursed to 3 unique destinations (ACC-DEST-A, ACC-DEST-B, ACC-DEST-C)
    assert context["unique_destinations_1h"] == 3.0


def test_longer_term_statistics_window():
    """
    Test 8: Verify longer-term statistics use lookback_days window and preserve data types.
    """
    txns = {
        "TX-1": create_mock_tx("TX-1", TARGET_ACCOUNT, "ACC-A", 100.0, BASE_TIME - timedelta(hours=2)),
        "TX-2": create_mock_tx("TX-2", TARGET_ACCOUNT, "ACC-B", 200.0, BASE_TIME - timedelta(days=1)),
        "TX-3": create_mock_tx("TX-3", TARGET_ACCOUNT, "ACC-C", 300.0, BASE_TIME - timedelta(days=4)),
        "TX-OLD": create_mock_tx("TX-OLD", TARGET_ACCOUNT, "ACC-D", 10000.0, BASE_TIME - timedelta(days=10)),
    }
    repo.reset_transactions(txns)

    context = transaction_service.get_account_activity_context(
        TARGET_ACCOUNT, as_of_timestamp=BASE_TIME, lookback_days=5
    )

    assert isinstance(context["historical_tx_count"], int)
    assert context["historical_tx_count"] == 3
    assert isinstance(context["historical_total_volume"], float)
    assert context["historical_total_volume"] == 600.0
    assert context["total_volume"] == 600.0
    assert context["lookback_days"] == 5


def test_timezone_aware_and_naive_policy():
    """
    Test 9: Timezone-aware normalization and strict rejection of ambiguous naive timestamps.
    """
    # 1. Aware timestamps in different timezones normalize to UTC properly
    # IST is UTC+5:30 -> 20:30 IST is 15:00 UTC
    tz_ist = timezone(timedelta(hours=5, minutes=30))
    as_of_ist = datetime(2026, 10, 24, 20, 30, 0, tzinfo=tz_ist)

    # Transaction at 14:30 UTC = 20:00 IST (inside 1-hour window)
    txns = {
        "TX-IST": create_mock_tx("TX-IST", TARGET_ACCOUNT, "ACC-A", 500.0, BASE_TIME - timedelta(minutes=30)),
    }
    repo.reset_transactions(txns)

    context = transaction_service.get_account_activity_context(
        TARGET_ACCOUNT, as_of_timestamp=as_of_ist, lookback_days=1
    )
    assert context["velocity_1h_count"] == 1.0
    assert context["velocity_1h_volume"] == 500.0

    # 2. String representation with 'Z'
    context_str = transaction_service.get_account_activity_context(
        TARGET_ACCOUNT, as_of_timestamp="2026-10-24T15:00:00Z", lookback_days=1
    )
    assert context_str["velocity_1h_count"] == 1.0

    # 3. Naive datetime must be explicitly rejected
    naive_dt = datetime(2026, 10, 24, 15, 0, 0)
    with pytest.raises(ValueError, match="timezone-aware"):
        transaction_service.get_account_activity_context(
            TARGET_ACCOUNT, as_of_timestamp=naive_dt, lookback_days=1
        )

    # 4. Naive ISO string without offset must be explicitly rejected
    with pytest.raises(ValueError, match="timezone-aware"):
        transaction_service.get_account_activity_context(
            TARGET_ACCOUNT, as_of_timestamp="2026-10-24T15:00:00", lookback_days=1
        )

    # 5. Schema validation rejects naive timestamp on TransactionCreate
    with pytest.raises(ValueError, match="timezone-aware"):
        TransactionCreate(
            sender_account_id="ACC-1",
            receiver_account_id="ACC-2",
            amount=100.0,
            timestamp=datetime(2026, 10, 24, 12, 0, 0),  # naive
        )


def test_scoring_service_passes_transaction_timestamp():
    """
    Test 10: Verify ScoringService passes the incoming transaction's timestamp
    into transaction_service.get_account_activity_context without falling back to current system time.
    """
    historical_event_time = datetime(2026, 1, 15, 10, 0, 0, tzinfo=timezone.utc)

    # Seed transaction repository with events around historical_event_time
    txns = {
        # 20 minutes prior to historical event -> within 1h
        "TX-HIST-1": create_mock_tx("TX-HIST-1", TARGET_ACCOUNT, "ACC-A", 15000.0, historical_event_time - timedelta(minutes=20)),
        # 30 minutes AFTER historical event -> must be EXCLUDED during replay of historical_event_time
        "TX-HIST-FUTURE": create_mock_tx("TX-HIST-FUTURE", TARGET_ACCOUNT, "ACC-B", 90000.0, historical_event_time + timedelta(minutes=30)),
    }
    repo.reset_transactions(txns)

    score_request = ScoreRequest(
        transaction=TransactionCreate(
            sender_account_id=TARGET_ACCOUNT,
            receiver_account_id="ACC-C",
            amount=5000.0,
            channel="wire",
            timestamp=historical_event_time,
        ),
        account_history_lookback_days=30,
        include_graph_context=True,
    )

    with patch.object(
        transaction_service, "get_account_activity_context", wraps=transaction_service.get_account_activity_context
    ) as spy_get_context:
        response = scoring_service.score_transaction(score_request)

        # Verify get_account_activity_context was called with the exact transaction timestamp
        spy_get_context.assert_called_once_with(
            account_id=TARGET_ACCOUNT,
            as_of_timestamp=historical_event_time,
            lookback_days=30,
        )

        # Verify the context generated excluded the post-historical transaction (TX-HIST-FUTURE)
        context_result = transaction_service.get_account_activity_context(
            TARGET_ACCOUNT, as_of_timestamp=historical_event_time, lookback_days=30
        )
        assert context_result["velocity_1h_count"] == 1.0
        assert context_result["velocity_1h_volume"] == 15000.0
        assert context_result["historical_tx_count"] == 1
        assert context_result["historical_total_volume"] == 15000.0
        assert response.risk_score > 0
