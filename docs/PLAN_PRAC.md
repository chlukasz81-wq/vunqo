# Vunqo — plan prac

## Etap 0 — przygotowanie projektu

Status: w trakcie

Cele:

- przygotować dokumentację projektu,
- uporządkować założenia,
- przygotować lokalny folder projektu w Cursorze,
- przygotować GitHub,
- przygotować VPS.

Pliki dokumentacji:

- docs/MAPA_PROJEKTU.md
- docs/ZASADY_DLA_CODEX.md
- docs/PLAN_PRAC.md
- docs/FUNKCJONALNOSCI.md

VPS jest już przygotowany:

- Debian 13,
- Nginx,
- Node.js,
- npm,
- pnpm,
- PM2,
- PostgreSQL,
- Git,
- firewall UFW,
- fail2ban,
- baza danych `vunqo_db`,
- użytkownik bazy `vunqo_user`.

Folder na VPS:

/home/debian/apps/vunqo

## Etap 1 — projekt lokalny w Cursorze

Status: następny krok

Cele:

- utworzyć projekt Next.js,
- włączyć TypeScript,
- dodać Tailwind CSS,
- przygotować podstawowy layout,
- przygotować strukturę folderów,
- przygotować pierwszą stronę Pulpitu,
- przygotować menu boczne.

Na tym etapie nie łączymy jeszcze Allegro ani BaseLinkera.

Używamy danych testowych.

## Etap 2 — podstawowy wygląd systemu

Cele:

- stworzyć layout aplikacji,
- stworzyć menu boczne,
- stworzyć nagłówek,
- stworzyć widok Pulpitu,
- stworzyć podstawowe tabele,
- stworzyć komponenty alertów,
- stworzyć komponenty kart/liczników.

Menu systemu:

- Pulpit,
- Produkty,
- Rentowność,
- Zamówienia,
- Analizy,
- Budżet,
- Oferty Allegro,
- Promocje i reklamy,
- Konkurencja cenowa,
- Obsługa klienta,
- Ustawienia.

Pulpit ma pokazywać alerty i priorytety, a nie skróty menu.

## Etap 3 — baza danych lokalnie / Prisma

Cele:

- skonfigurować Prisma,
- podłączyć PostgreSQL,
- przygotować pierwszy model danych,
- utworzyć migracje,
- przygotować dane testowe.

Początkowe tabele:

- products,
- allegro_offers,
- sales,
- costs,
- stock_alerts,
- customer_cases,
- reviews,
- budget_expenses,
- budget_income,
- budget_categories,
- settings.

Na tym etapie dane mogą być ręcznie testowe.

## Etap 4 — moduł Produkty

Cele:

- stworzyć widok listy produktów,
- pokazać SKU,
- nazwę,
- stan,
- cenę zakupu,
- dostawcę,
- powiązanie z ofertami Allegro,
- sprzedaż z ostatnich dni,
- informację, czy trzeba domówić.

Na tym etapie dane mogą być testowe.

## Etap 5 — moduł Rentowność

Cele:

- liczyć zysk na sztuce,
- pokazywać marżę,
- pokazywać koszty Allegro,
- pokazywać koszt reklamy,
- oznaczać produkty poniżej minimalnej opłacalności.

Podstawowy wzór:

zysk = cena sprzedaży - cena zakupu - prowizje Allegro - reklama - inne koszty

## Etap 6 — moduł Zamówienia

Cele:

- analizować stan magazynowy,
- analizować sprzedaż z ostatnich 7/30 dni,
- obliczać średnią sprzedaż dzienną,
- wyliczać, na ile dni wystarczy towar,
- sugerować ilość do zamówienia.

Moduł Zamówienia nie jest ograniczony tylko do jednej hurtowni.

W przyszłości może obsługiwać:

- hurtownie,
- dostawców,
- import,
- ręczne zamówienia,
- kilka źródeł zakupu.

## Etap 7 — moduł Budżet

Cele:

- stworzyć panel Budżet,
- dodawać przyszłe płatności,
- ustawiać datę płatności,
- ustawiać kwotę płatności,
- dodawać kategorię kosztu,
- nadawać własną nazwę kosztu,
- oznaczać koszt jako jednorazowy albo cykliczny,
- obsługiwać cykliczne opłaty miesięczne,
- zatwierdzać, czy kwota cykliczna w danym miesiącu się nie zmieniła,
- zmieniać kwotę cykliczną dla konkretnego miesiąca,
- wprowadzać przychody,
- dodawać kategorie przychodów,
- porównywać przychody i koszty na dany dzień,
- pokazywać, czy dzienny przychód pokrywa dzienne wydatki,
- pokazywać nadwyżkę albo brakującą kwotę.

Widoki w module Budżet:

- dzisiaj,
- najbliższe 7 dni,
- najbliższe 15 dni,
- najbliższe 30 dni,
- cały miesiąc,
- własny zakres dat.

Tabela Budżetu ma pokazywać:

- datę płatności,
- nazwę kosztu lub przychodu,
- kategorię,
- typ: koszt albo przychód,
- kwotę,
- status: zaplanowane, zapłacone, opóźnione, przesunięte,
- informację, czy pozycja jest cykliczna,
- informację, czy cykliczna kwota została zatwierdzona w tym miesiącu.

Przykładowe kategorie kosztów:

- ZUS i podatki,
- Allegro,
- reklamy,
- towar,
- leasing / auto,
- księgowość,
- abonamenty,
- serwery i domeny,
- pracownicy / zlecenia,
- inne.

Przykładowe kategorie przychodów:

- sprzedaż Allegro,
- sprzedaż sklep internetowy,
- hurtownia,
- zwroty środków,
- inne przychody.

Cel biznesowy modułu Budżet:

- pokazać, ile trzeba zapłacić danego dnia,
- pokazać, ile trzeba zapłacić w najbliższych 15 albo 30 dniach,
- pokazać, czy przychody pokryją opłaty,
- pokazać, ile pieniędzy zabraknie,
- pokazać, ile zostanie po opłatach,
- wskazać dni najbardziej obciążone płatnościami.

Na początku moduł Budżet może działać na danych ręcznie wpisywanych przez użytkownika.

Integracje z bankiem albo automatyczne pobieranie płatności nie wchodzą do pierwszej wersji.

## Etap 8 — moduł Analizy

Cele:

- wykres sprzedaży,
- sprzedaż z ostatnich 7/14/30 dni,
- porównanie okresów,
- spadki sprzedaży,
- koszty Allegro jako procent sprzedaży,
- podstawowe KPI.

W karcie produktu/oferty ma być wykres słupkowy sprzedaży dziennej.

Przykładowe filtry:

- ostatnie 7 dni,
- ostatnie 14 dni,
- ostatnie 30 dni,
- własny zakres dat,
- konto Allegro,
- produkt,
- kategoria,
- dostawca.

## Etap 9 — moduł Oferty Allegro

Cele:

- stworzyć widok ofert Allegro,
- pokazać ID oferty,
- konto Allegro,
- cenę,
- status,
- Super Cenę,
- reklamę,
- opinie,
- powiązany produkt.

Na początku dane testowe.

API Allegro dopiero później.

## Etap 10 — Obsługa klienta

Cele:

- stworzyć jeden panel obsługi klienta,
- dodać chipy z licznikami:
  - Wiadomości,
  - Dyskusje,
  - Zwroty,
  - Reklamacje,
  - Przesyłki,
  - Kartoteka klienta.
- pokazać przykładowe sprawy,
- pokazać kartotekę klienta.

Przy chipach mają być małe liczniki, np.:

- Wiadomości 4,
- Dyskusje 2,
- Zwroty 3,
- Reklamacje 1,
- Przesyłki 5.

Nie dublujemy tych liczników dużymi kafelkami.

## Etap 11 — Ustawienia

Cele:

- stworzyć widok ustawień,
- dodać sekcje:
  - Wygląd,
  - API i połączenia,
  - Konta Allegro,
  - Powiadomienia,
  - Użytkownicy,
  - Reguły systemu.

Połączenia API są częścią Ustawień, nie osobnym modułem w menu.

Ustawienia mają obejmować:

- kolorystykę systemu,
- motyw jasny / ciemny,
- widok startowy,
- gęstość tabel,
- BaseLinker API,
- Allegro API,
- konta Allegro,
- dostawców / hurtownie,
- powiadomienia,
- reguły marży,
- reguły alertów.

## Etap 12 — GitHub

Cele:

- utworzyć repozytorium `vunqo`,
- zrobić pierwszy commit,
- wypchnąć projekt na GitHub,
- dodać `.gitignore`,
- dodać `.env.example`,
- nie wrzucać `.env` na GitHub.

GitHub ma być miejscem przechowywania kodu i historii zmian.

Kod powstaje lokalnie w Cursorze, potem trafia na GitHub.

## Etap 13 — wdrożenie na VPS

Cele:

- pobrać projekt z GitHuba na VPS,
- zainstalować zależności,
- zbudować aplikację,
- uruchomić przez PM2,
- podpiąć Nginx jako reverse proxy,
- podpiąć domenę,
- dodać SSL.

VPS nie jest miejscem do codziennego kodowania.

VPS służy do uruchomienia gotowej aplikacji online.

## Etap 14 — BaseLinker API

Cele:

- podłączyć BaseLinker API,
- pobierać produkty,
- pobierać stany,
- pobierać ceny zakupu,
- powiązać dane z produktami w systemie.

BaseLinker ma być źródłem danych o:

- produktach,
- SKU,
- cenach zakupu,
- stanach magazynowych,
- powiązaniach z ofertami,
- ewentualnie historii sprzedaży, jeśli będzie dostępna.

Jeżeli BaseLinker zarządza cenami ofert Allegro, zmiana ceny powinna iść przez BaseLinkera.

## Etap 15 — Allegro API

Cele:

- podłączyć Allegro API,
- obsłużyć wiele kont Allegro,
- pobierać oferty,
- pobierać dane sprzedaży,
- pobierać koszty,
- pobierać opinie,
- pobierać komunikację, jeśli API pozwoli.

Z Allegro chcemy pobierać:

- oferty,
- ceny,
- prowizje,
- koszty sprzedaży,
- reklamy,
- promocje,
- kampanie,
- opinie,
- wiadomości,
- dyskusje,
- zwroty,
- reklamacje,
- dane zamówień,
- statusy przesyłek,
- informacje o jakości konta, jeśli API pozwoli.

## Etap 16 — automatyzacje i alerty

Cele:

- alert o niskim stanie,
- alert o spadku sprzedaży,
- alert o nowej opinii,
- alert o wiadomości bez odpowiedzi,
- alert o reklamie zjadającej zysk,
- alert o utracie opłacalności ceny,
- alert o problemie z przesyłką,
- alert o pilnej reklamacji,
- alert o dniu z wysokimi płatnościami w Budżecie,
- alert, że przychód danego dnia nie pokryje zaplanowanych opłat.

Alerty mają trafiać na Pulpit tylko wtedy, gdy wymagają reakcji.

## Zasada kolejności

Nie robimy integracji API przed przygotowaniem podstawowego panelu i danych testowych.

Najpierw ma działać:

1. wygląd,
2. menu,
3. dane testowe,
4. baza,
5. logika,
6. dopiero potem API.

## Zasada pracy z AI

AI/Cursor/Codex ma czytać najpierw:

- docs/MAPA_PROJEKTU.md,
- docs/ZASADY_DLA_CODEX.md,
- docs/PLAN_PRAC.md,
- docs/FUNKCJONALNOSCI.md.

AI nie może zmieniać głównych założeń bez zgody właściciela projektu.

Jeżeli zmiana wpływa na logikę biznesową, menu, integracje, bazę danych lub sposób liczenia rentowności, AI ma najpierw zaproponować zmianę i poczekać na akceptację.

## Obecny najbliższy krok

Najbliższy krok po dokumentacji:

- utworzyć projekt Next.js lokalnie w Cursorze,
- skonfigurować TypeScript,
- skonfigurować Tailwind CSS,
- stworzyć pierwszy layout Vunqo,
- zrobić Pulpit z alertami i priorytetami na danych testowych.
