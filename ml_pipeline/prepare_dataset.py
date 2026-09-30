"""
Refined Realistic Dataset Generator for AI in Finance Anti-Fraud Competition.
Includes:
- Realistic class overlap, borderline transactions, noise
- False positive triggers (legit late-night transfers, urgent gifts)
- Fraud evasion techniques (split amounts, daytime transfers)
- Clean Cyrillic tokenization for Russian text memos
"""

import numpy as np
import pandas as pd
import random
from datetime import datetime, timedelta

def generate_realistic_banking_dataset(n_samples=25000, random_seed=42):
    np.random.seed(random_seed)
    random.seed(random_seed)

    legit_memos = [
        "Перевод маме", "Возврат долга", "Оплата обеда", "Подарок на день рождения",
        "На продукты", "Аренда жилья", "Зарплата", "Коммуналка", "Пополнение карты",
        "На карманные расходы", "За бензин", "Оплата кофе", "Срочно на карту",
        "Билеты в кино", "Перевод коллеге", "Услуги репетитора"
    ]

    suspicious_memos = [
        "Срочный перевод без комиссии", "Вывод с криптобиржи P2P USDT", "Оплата криптообмен",
        "Срочно на лечение родственника", "Безопасный счет ЦБ", "Выигрыш в лотерею",
        "Инвестиционный доход 100%", "Разблокировка карты", "Пополнение дроп счета",
        "Быстрый перевод без подтверждения", "Возврат долга", "Перевод другу"
    ]

    client_ids = [f"KZ_USR_{i:04d}" for i in range(1, 1201)]
    client_profiles = {}
    for cid in client_ids:
        base_mean = float(np.random.uniform(20000, 180000))
        known_recipients = [f"KZ_REC_{random.randint(100, 899)}" for _ in range(random.randint(3, 9))]
        client_profiles[cid] = {
            "base_mean": base_mean,
            "known_recipients": known_recipients
        }

    records = []
    base_date = datetime(2025, 4, 1, 0, 0, 0)

    for i in range(n_samples):
        txn_id = f"TXN-2025-{i+1:06d}"
        client_id = random.choice(client_ids)
        profile = client_profiles[client_id]

        # Target ~2.8% true fraud rate
        is_fraud = 1 if np.random.rand() < 0.028 else 0
        days_offset = random.randint(0, 60)

        if is_fraud:
            # Sophisticated fraud distributions:
            # 55% at night (01:00 - 05:00), 45% during day (stealth attacks)
            if np.random.rand() < 0.55:
                hour = random.choice([1, 2, 3, 4, 5])
            else:
                hour = random.randint(6, 23)
            minute = random.randint(0, 59)
            second = random.randint(0, 59)

            # Amount deviation: 65% large, 35% stealth low/medium amount
            if np.random.rand() < 0.65:
                multiplier = np.random.uniform(3.2, 9.5)
            else:
                multiplier = np.random.uniform(0.9, 2.8) # stealth fraud
            
            amount = round(profile["base_mean"] * multiplier, -2)
            amount = max(12000.0, amount)

            # Sender balance
            balance_before = round(amount * np.random.uniform(1.05, 2.5), -2)
            balance_empty_ratio = round(amount / balance_before, 3)

            # Recipient: 78% new recipient, 22% compromised friend/known account
            is_new_recipient = 1 if np.random.rand() < 0.78 else 0
            recipient_id = f"KZ_DROP_{random.randint(1000, 9999)}" if is_new_recipient else random.choice(profile["known_recipients"])

            # Anomalies
            is_new_device = 1 if np.random.rand() < 0.68 else 0
            is_foreign_ip = 1 if np.random.rand() < 0.52 else 0
            velocity_last_24h = int(np.random.choice([1, 2, 3, 4, 6], p=[0.15, 0.25, 0.30, 0.20, 0.10]))

            memo_text = random.choice(suspicious_memos) if np.random.rand() < 0.65 else random.choice(legit_memos)
            txn_type = random.choice(["P2P_TRANSFER", "CASH_OUT", "P2P_TRANSFER"])
        else:
            # Legitimate transactions:
            # Hourly distribution (peaks 09:00 - 21:00, but ~5% legit nighttime transfers)
            hour_weights = [
                0.015, 0.008, 0.006, 0.005, 0.008, 0.012, # 00:00 - 05:00
                0.025, 0.045, 0.065, 0.080, 0.085, 0.085, # 06:00 - 11:00
                0.085, 0.080, 0.075, 0.075, 0.075, 0.075, # 12:00 - 17:00
                0.070, 0.060, 0.045, 0.035, 0.020, 0.014  # 18:00 - 23:00
            ]
            hour = int(np.random.choice(range(24), p=hour_weights / np.sum(hour_weights)))
            minute = random.randint(0, 59)
            second = random.randint(0, 59)

            # Normal amount around baseline, with 4% legitimate large one-off purchases (false positive candidates)
            if np.random.rand() < 0.04:
                multiplier = np.random.uniform(3.0, 6.0) # legit large transfer
            else:
                multiplier = float(np.random.lognormal(mean=-0.05, sigma=0.55))
            
            amount = round(profile["base_mean"] * multiplier, -2)
            amount = max(1000.0, min(amount, 950000.0))

            balance_before = round(amount * np.random.uniform(1.8, 12.0), -2)
            balance_empty_ratio = round(amount / balance_before, 3)

            # 22% legit transactions are to new recipients (e.g., buying from someone new)
            is_new_recipient = 1 if np.random.rand() < 0.22 else 0
            recipient_id = f"KZ_REC_{random.randint(1000, 9999)}" if is_new_recipient else random.choice(profile["known_recipients"])

            # 8% legit users use a new phone or hotel/mobile IP
            is_new_device = 1 if np.random.rand() < 0.09 else 0
            is_foreign_ip = 1 if np.random.rand() < 0.05 else 0
            velocity_last_24h = int(np.random.choice([1, 2, 3], p=[0.78, 0.18, 0.04]))

            memo_text = random.choice(legit_memos)
            txn_type = random.choice(["P2P_TRANSFER", "PAYMENT", "MERCHANT"])

        timestamp = base_date + timedelta(days=days_offset, hours=int(hour), minutes=int(minute), seconds=int(second))
        amount_deviation_ratio = round(amount / profile["base_mean"], 2)

        records.append({
            "transaction_id": txn_id,
            "sender_id": client_id,
            "recipient_id": recipient_id,
            "amount": float(amount),
            "currency": "KZT",
            "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "hour": int(hour),
            "minute": int(minute),
            "day_of_week": timestamp.weekday(),
            "transaction_type": txn_type,
            "sender_balance_before": float(balance_before),
            "sender_avg_amount": round(profile["base_mean"], 2),
            "amount_deviation_ratio": float(amount_deviation_ratio),
            "balance_empty_ratio": float(balance_empty_ratio),
            "is_new_recipient": int(is_new_recipient),
            "velocity_last_24h": int(velocity_last_24h),
            "is_new_device": int(is_new_device),
            "is_foreign_ip": int(is_foreign_ip),
            "memo_text": memo_text,
            "is_fraud": int(is_fraud)
        })

    df = pd.DataFrame(records)
    return df

if __name__ == "__main__":
    print("Generating competition banking transactions dataset with realistic noise...")
    df = generate_realistic_banking_dataset(n_samples=25000, random_seed=42)
    df.to_csv("ml_pipeline/data/bank_transactions_dataset.csv", index=False, encoding="utf-8")
    
    # Save 1000 sample batch for web testing
    sample_1000 = df.sample(n=1000, random_state=123).copy()
    sample_1000.to_csv("ml_pipeline/data/sample_batch_1000.csv", index=False, encoding="utf-8")
    print(f"Generated {len(df)} records. Fraud count: {df['is_fraud'].sum()} ({df['is_fraud'].mean()*100:.2f}%)")
