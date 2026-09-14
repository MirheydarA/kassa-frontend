export default function CurrencyBadge({ currency }) {
  const isUsd = currency === 'USD'
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
        isUsd ? 'bg-usd-light text-usd' : 'bg-rub-light text-rub'
      }`}
    >
      {currency}
    </span>
  )
}
