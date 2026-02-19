# Перевод страницы "Контакты"

Текущая проблема: контент на эстонском на всех языковых версиях.

---

## Эстонский (ET) — Оригинал

### Заголовок
**Kontakt**

### Основной текст
Soovite tellida eritellimuskööki või näha valmis projekte? Võtke meiega ühendust ja aitame luua köögi, mis ületab teie ootused.

### Контактные данные
- **Aadress:** Pärnu mnt 139c, Tallinn 11317
- **Telefon:** +372 55 525 143
- **E-post:** maksim@studiokook.ee
- **Tööaeg:** E-R 09:00-18:00

### Форма
- Nimi (Name)
- E-post (Email)
- Telefon (Phone)
- Sõnum (Message)
- Saada (Send)

---

## Русский (RU)

### Заголовок
**Контакты**

### Основной текст
Хотите заказать кухню по индивидуальному проекту или посмотреть готовые работы? Свяжитесь с нами, и мы поможем создать кухню, которая превзойдёт ваши ожидания.

### Контактные данные
- **Адрес:** Пярну мнт 139c, Таллинн 11317
- **Телефон:** +372 55 525 143
- **Email:** maksim@studiokook.ee
- **Часы работы:** Пн-Пт 09:00-18:00

### Форма
- Имя
- Email
- Телефон
- Сообщение
- Отправить

---

## Английский (EN)

### Заголовок
**Contact**

### Основной текст
Want to order a custom kitchen or see completed projects? Get in touch with us and we'll help create a kitchen that exceeds your expectations.

### Контактные данные
- **Address:** Pärnu mnt 139c, Tallinn 11317
- **Phone:** +372 55 525 143
- **Email:** maksim@studiokook.ee
- **Working hours:** Mon-Fri 09:00-18:00

### Форма
- Name
- Email
- Phone
- Message
- Send

---

## Финский (FI)

### Заголовок
**Yhteystiedot**

### Основной текст
Haluatko tilata mittatilauskeittön tai nähdä valmiita projekteja? Ota yhteyttä, niin autamme sinua luomaan keittiön, joka ylittää odotuksesi.

### Контактные данные
- **Osoite:** Pärnu mnt 139c, Tallinna 11317
- **Puhelin:** +372 55 525 143
- **Sähköposti:** maksim@studiokook.ee
- **Aukioloajat:** Ma-Pe 09:00-18:00

### Форма
- Nimi
- Sähköposti
- Puhelin
- Viesti
- Lähetä

---

## Как применить

### Вариант 1: TranslatePress (рекомендуется)
1. Перейти на `/ru/kontakt/`
2. Открыть панель TranslatePress
3. Последовательно кликать на каждый элемент и вводить перевод
4. Сохранить
5. Повторить для `/en/kontakt/` и `/fi/kontakt/`

### Вариант 2: Elementor
1. WP Admin → Pages → Kontakt
2. Дублировать страницу для каждого языка
3. Редактировать в Elementor, заменяя текст
4. Связать страницы в TranslatePress

---

## Schema.org LocalBusiness (добавить в Code Snippets)

```json
{
  "@context": "https://schema.org",
  "@type": "FurnitureStore",
  "name": "Studioköök",
  "image": "https://studiokook.ee/wp-content/uploads/2024/01/logo.png",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Pärnu mnt 139c",
    "addressLocality": "Tallinn",
    "postalCode": "11317",
    "addressCountry": "EE"
  },
  "telephone": "+372 55 525 143",
  "email": "maksim@studiokook.ee",
  "openingHours": "Mo-Fr 09:00-18:00",
  "url": "https://studiokook.ee/",
  "priceRange": "€€€"
}
```
