def make_spending_summary(transactions):
    if not transactions:
        return "Данных о расходах пока нет."

    summary = {}
    total = 0

    for tx in transactions:
        try:
            amt = float(tx["amount"]["amount"])
            cat = tx.get("transactionInformation", "Прочее")
            summary[cat] = summary.get(cat, 0) + amt
            total += amt
        except Exception:
            continue

    if not total:
        return "Нет трат, подходящих под анализ."

    lines = [f"Всего расходов: {total:.2f} ₽"]
    for cat, amt in sorted(summary.items(), key=lambda x: x[1], reverse=True):
        percent = amt / total * 100
        lines.append(f"- {cat}: {amt:.2f} ₽ ({percent:.1f}%)")

    return "\n".join(lines)
