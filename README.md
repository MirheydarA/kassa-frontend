# Kassa — Frontend

React (Vite, JS) + Tailwind CSS + React Query + Zustand ilə qurulmuş frontend. Backend olaraq .NET Kassa API-yə qoşulur.

## İşə salma

```bash
npm install
cp .env.example .env   # VITE_API_URL-i öz backend ünvanınıza uyğunlaşdırın (default: http://localhost:5000)
npm run dev
```

Brauzerdə: http://localhost:5173

Backend-in CORS ayarlarında `http://localhost:5173` icazə verilməlidir (əks halda login/istəklər bloklanacaq).

## Struktur

```
src/
  api/          axios sorğuları (hər controller üçün ayrı fayl)
  store/        zustand — auth (token, username)
  components/   Layout, Modal, Pagination, ClientAutocomplete, CurrencyBadge, ProtectedRoute
  pages/        Dashboard (Kassa), Loans, MyDebts, Exchange, Expenses, Clients
  lib/format.js pul və tarix formatlama
```

## Qeydlər

- Bütün pullu əməliyyatlar (`Borc ver`, `Mənim borclarım`, `Exchange`, `Xərclər`) uğurlu olduqda avtomatik olaraq Kassa balansını və əməliyyat siyahısını yeniləyir (React Query invalidation).
- `clientName` sahələri sərbəst mətndir — mövcud müştərini axtarıb seçmək və ya yeni ad yazmaq mümkündür (`Clients` API-dən asılı deyil, amma `ClientAutocomplete` mövcud adları təklif edir).
- `Loans` üçün qismən ödəniş `POST /api/loans/{id}/payments` ilə edilir, qalıq (`remainingAmount`) backend-dən gəlir.
- `Exchange`-də iki valyuta bir-birinin əksi olaraq seçilir (USD ↔ RUB).
- `MyDebts` API-də ayrıca ödəniş endpoint-i olmadığı üçün yalnız yaratmaq/redaktə funksionallığı var.

## Növbəti addımlar (sizin qeyd etdiyiniz kimi)

1. Dockerfile + docker-compose (frontend + backend)
2. Contabo serverə deploy
3. CI/CD pipeline
