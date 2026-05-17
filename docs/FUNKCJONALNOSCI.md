# Vunqo — funkcjonalności systemu

## 1. Cel dokumentu

Ten dokument opisuje funkcje, które system Vunqo ma posiadać.

Plik jest uzupełnieniem dokumentów:

- docs/MAPA_PROJEKTU.md
- docs/PLAN_PRAC.md
- docs/ZASADY_DLA_CODEX.md

Jeżeli w przyszłości dojdzie nowa funkcja, najpierw dopisujemy ją tutaj, a dopiero potem programujemy.

---

## 2. Pulpit

Pulpit jest ekranem startowym systemu.

Nie jest kopią menu.

Pulpit pokazuje tylko rzeczy, które wymagają reakcji.

### Funkcje Pulpitu

- pokazanie spraw klientów bez odpowiedzi,
- pokazanie pilnych zamówień,
- pokazanie produktów z niskim stanem,
- pokazanie spadków sprzedaży,
- pokazanie reklam z niską opłacalnością,
- pokazanie nowych opinii,
- pokazanie alertów rentowności,
- pokazanie listy dzisiejszych zadań,
- przejście z alertu do właściwego modułu,
- filtrowanie Pulpitu po koncie Allegro,
- odświeżanie danych.

### Przykładowe alerty na Pulpicie

- 7 spraw klientów bez odpowiedzi,
- 6 produktów pilnie do zamówienia,
- 5 produktów ze spadkiem sprzedaży,
- 3 reklamy do kontroli,
- 2 nowe opinie produktów.

### Zasada

Na Pulpicie nie pokazujemy wszystkiego.

Pokazujemy tylko to, co pomaga odpowiedzieć na pytanie:

Co mam zrobić teraz?

---

## 3. Produkty

Moduł Produkty jest bazą towarów.

Produkty pochodzą głównie z BaseLinkera.

Produkt nie jest tym samym co oferta Allegro.

### Funkcje modułu Produkty

- lista produktów,
- wyszukiwarka produktów,
- filtrowanie po SKU,
- filtrowanie po nazwie,
- filtrowanie po dostawcy,
- filtrowanie po stanie magazynowym,
- filtrowanie po produktach do zamówienia,
- widok szczegółów produktu,
- cena zakupu,
- stan magazynowy,
- SKU,
- EAN,
- dostawca,
- powiązane oferty Allegro,
- sprzedaż z ostatnich dni,
- informacja, czy produkt trzeba domówić,
- informacja, ile sztuk sugeruje system.

### Dane produktu

- ID produktu,
- nazwa,
- SKU,
- EAN,
- cena zakupu netto,
- cena zakupu brutto, jeśli potrzebna,
- aktualny stan magazynowy,
- dostawca,
- data ostatniej synchronizacji,
- powiązania z ofertami Allegro.

---

## 4. Oferty Allegro

Moduł Oferty Allegro pokazuje aukcje/oferty sprzedażowe na Allegro.

Oferta Allegro jest powiązana z produktem z BaseLinkera.

### Funkcje modułu Oferty Allegro

- lista ofert Allegro,
- wyszukiwarka ofert,
- filtrowanie po koncie Allegro,
- filtrowanie po statusie oferty,
- filtrowanie po produkcie,
- filtrowanie po reklamie aktywnej,
- filtrowanie po Super Cenie,
- widok szczegółów oferty,
- aktualna cena oferty,
- status oferty,
- ID oferty Allegro,
- nazwa oferty,
- powiązany produkt,
- opinie oferty,
- aktywne promocje,
- aktywne reklamy,
- analiza konkurencji cenowej,
- alerty dla oferty.

### Ważna zasada

Jeżeli BaseLinker zarządza cenami ofert Allegro, Vunqo nie powinien zmieniać ceny bezpośrednio na Allegro.

Zmiana ceny powinna iść przez BaseLinkera, żeby nie zrobić rozjazdu danych.

---

## 5. Rentowność

Moduł Rentowność liczy realny zysk na produkcie lub ofercie.

### Funkcje modułu Rentowność

- pokazanie zysku na sztuce,
- pokazanie marży procentowej,
- pokazanie ceny zakupu,
- pokazanie ceny sprzedaży,
- pokazanie prowizji Allegro,
- pokazanie kosztów reklamy,
- pokazanie kosztów promocji,
- pokazanie innych kosztów,
- alert przy niskim zysku,
- alert przy niskiej marży,
- symulacja zmiany ceny,
- minimalna opłacalna cena,
- informacja, czy można zejść z ceną,
- informacja, czy reklama zjada zysk.

### Podstawowy wzór

zysk = cena sprzedaży - cena zakupu - prowizje Allegro - reklama - inne koszty

### Przykładowe decyzje systemu

- produkt opłacalny,
- produkt na granicy opłacalności,
- nie obniżać ceny,
- reklama zjada zysk,
- można obniżyć cenę o określoną kwotę,
- sprawdzić ręcznie.

---

## 6. Zamówienia

Moduł Zamówienia służy do planowania zakupów u dostawców.

Nie ograniczamy go nazwą „Zamówienia z hurtowni”, bo w przyszłości mogą być różne źródła zakupu.

### Funkcje modułu Zamówienia

- lista produktów do zamówienia,
- sugestia ilości do zamówienia,
- informacja, na ile dni wystarczy stan,
- analiza sprzedaży z ostatnich 7 dni,
- analiza sprzedaży z ostatnich 30 dni,
- średnia sprzedaż dzienna,
- minimalny zapas bezpieczeństwa,
- priorytet zamówienia,
- filtrowanie po dostawcy,
- filtrowanie po pilności,
- tworzenie listy zamówienia,
- ręczna korekta ilości,
- eksport listy zamówienia,
- historia wygenerowanych list zamówień.

### Przykład działania

Produkt sprzedał się 14 razy w 7 dni.

Średnia sprzedaż to 2 sztuki dziennie.

Na stanie są 4 sztuki.

Towaru wystarczy na 2 dni.

System sugeruje zamówić minimum 14 sztuk na kolejne 7 dni plus zapas.

---

## 7. Analizy

Moduł Analizy pokazuje dane sprzedażowe, koszty i trendy.

Nazwa „Analizy” jest lepsza niż „Statystyki”, bo moduł nie pokazuje tylko wykresów.

### Funkcje modułu Analizy

- sprzedaż w czasie,
- sprzedaż z ostatnich 7 dni,
- sprzedaż z ostatnich 14 dni,
- sprzedaż z ostatnich 30 dni,
- własny zakres dat,
- wykres słupkowy sprzedaży dziennej,
- porównanie okresów,
- wykrywanie spadku sprzedaży,
- koszty Allegro jako procent sprzedaży,
- prowizje Allegro,
- koszty reklam,
- koszty promocji,
- podstawowe KPI,
- analiza po produkcie,
- analiza po ofercie,
- analiza po koncie Allegro,
- analiza po dostawcy,
- analiza po kategorii.

### Przykładowy alert

Produkt sprzedał się w ostatnich 7 dniach 6 razy.

W poprzednich 7 dniach sprzedał się 21 razy.

System pokazuje alert:

sprzedaż spadła o 71%.

---

## 8. Promocje i reklamy

Moduł Promocje i reklamy dotyczy działań marketingowych na Allegro.

Nie używamy samej nazwy „Marketing”, bo jest zbyt ogólna.

### Funkcje modułu Promocje i reklamy

- lista aktywnych promocji,
- lista aktywnych reklam,
- status Allegro Ads,
- status wyróżnień,
- status monet,
- status kampanii,
- koszt reklamy,
- koszt promocji,
- wpływ reklamy na zysk,
- wpływ promocji na zysk,
- alert o niskiej opłacalności reklamy,
- informacja, które oferty mają reklamę aktywną,
- informacja, które reklamy warto sprawdzić.

### Przykładowy alert

Oferta ma reklamę aktywną.

Koszt reklamy wynosi 3 zł na sztuce.

Zysk po reklamie spada poniżej minimum.

System pokazuje alert:

sprawdź reklamę albo zmień cenę.

---

## 9. Konkurencja cenowa

Moduł Konkurencja cenowa analizuje pozycję oferty względem innych ofert Allegro.

### Funkcje modułu Konkurencja cenowa

- porównanie mojej ceny z konkurencją,
- najniższa cena w produkcie,
- różnica do najniższej ceny,
- cena z dostawą,
- status Super Cena,
- inne oznaczenia Allegro,
- analiza, czy można obniżyć cenę,
- analiza zysku po zejściu do ceny konkurencji,
- minimalna cena opłacalna,
- alert, gdy zejście do konkurencji oznacza stratę.

### Przykładowe decyzje

- można obniżyć cenę o 2 zł,
- nie schodzić do najniższej ceny,
- cena konkurencji jest poniżej opłacalności,
- sprawdzić ręcznie,
- oferta utraciła Super Cenę.

---

## 10. Opinie produktów

Opinie nie są osobnym modułem w menu głównym.

Opinie są widoczne w Ofertach Allegro i na Pulpicie jako alert, jeśli są nowe lub ważne.

### Funkcje opinii

- lista opinii dla oferty,
- średnia ocena,
- liczba gwiazdek,
- data opinii,
- treść opinii,
- informacja, czy opinia jest nowa,
- powiązany produkt,
- powiązana oferta,
- alert o nowej opinii,
- oznaczenie opinii wymagającej reakcji.

### Przykładowy alert

Nowa opinia 3 gwiazdki.

Klient pisze, że opakowanie było uszkodzone.

System dodaje alert na Pulpit.

---

## 11. Obsługa klienta

Obsługa klienta jest jednym centrum spraw.

Nie robimy osobnych głównych modułów dla wiadomości, dyskusji, zwrotów i reklamacji.

Wszystko jest w jednym miejscu.

### Chippy w Obsłudze klienta

- Wiadomości,
- Dyskusje,
- Zwroty,
- Reklamacje,
- Przesyłki,
- Kartoteka klienta.

Przy chipach mają być małe liczniki, np.:

- Wiadomości 4,
- Dyskusje 2,
- Zwroty 3,
- Reklamacje 1,
- Przesyłki 5.

Nie dublujemy tych liczników dużymi kafelkami.

### Funkcje Obsługi klienta

- lista wiadomości,
- lista dyskusji,
- lista zwrotów,
- lista reklamacji,
- lista problemów z przesyłkami,
- odpowiedź do klienta,
- status sprawy,
- priorytet sprawy,
- filtrowanie spraw bez odpowiedzi,
- filtrowanie spraw pilnych,
- podgląd zamówienia,
- podgląd klienta,
- podgląd przesyłki,
- link śledzenia przesyłki.

---

## 12. Kartoteka klienta

Kartoteka klienta pokazuje pełną historię kupującego.

### Funkcje kartoteki klienta

- dane klienta,
- e-mail Allegro,
- liczba zamówień,
- suma wartości zamówień,
- historia zakupów,
- historia zwrotów,
- historia reklamacji,
- historia dyskusji,
- historia wiadomości,
- status aktualnej przesyłki,
- czy klient jest powracający,
- notatka wewnętrzna,
- podsumowanie relacji z klientem.

### Cel

Jeżeli klient jest stały i pojawia się problem, można podejść do niego inaczej, np. szybciej pomóc, dodać gratis albo rabat.

---

## 13. Ustawienia

Ustawienia są jedynym miejscem dla konfiguracji systemu.

Połączenia API nie są osobnym modułem w menu.

Są częścią Ustawień.

### Sekcje Ustawień

- Wygląd,
- API i połączenia,
- Konta Allegro,
- Powiadomienia,
- Użytkownicy,
- Reguły systemu.

### Funkcje wyglądu

- motyw jasny,
- motyw ciemny,
- kolor główny systemu,
- gęstość tabel,
- widok startowy,
- układ menu.

### Funkcje API i połączeń

- BaseLinker API,
- Allegro API,
- konta Allegro,
- dostawcy,
- hurtownie,
- przyszłe sklepy internetowe,
- status połączeń,
- ostatnia synchronizacja,
- test połączenia.

### Funkcje powiadomień

- alert nowej opinii,
- alert niskiego stanu,
- alert spadku sprzedaży,
- alert wiadomości bez odpowiedzi,
- alert reklamacji,
- alert reklamy zjadającej zysk.

### Funkcje reguł systemu

- minimalny zysk na sztuce,
- minimalna marża procentowa,
- okres analizy do zamówień,
- próg alertu spadku sprzedaży,
- reguła zmiany cen przez BaseLinkera,
- ustawienia zapasu bezpieczeństwa.

---

## 14. Integracja BaseLinker

### Dane pobierane z BaseLinkera

- produkty,
- SKU,
- EAN,
- ceny zakupu,
- stany magazynowe,
- powiązania z ofertami,
- historia sprzedaży, jeśli dostępna,
- magazyny,
- dostawcy, jeśli dostępni.

### Dane wysyłane do BaseLinkera

- zmiany cen, jeśli BaseLinker jest źródłem prawdy,
- ewentualne aktualizacje produktów,
- ewentualne dane pomocnicze, jeśli będzie to bezpieczne.

---

## 15. Integracja Allegro

### Dane pobierane z Allegro

- oferty,
- ceny,
- statusy ofert,
- zamówienia,
- koszty,
- prowizje,
- promocje,
- reklamy,
- kampanie,
- opinie,
- wiadomości,
- dyskusje,
- zwroty,
- reklamacje,
- statusy przesyłek,
- dane jakości konta, jeśli API pozwoli.

### Dane wysyłane do Allegro

- odpowiedzi do klientów,
- działania w dyskusjach,
- obsługa zwrotów,
- obsługa reklamacji,
- działania marketingowe,
- zmiany kampanii, jeśli API pozwoli.

---

## 16. Logowanie i użytkownicy

System powinien mieć logowanie.

Na początku może być jeden użytkownik administracyjny.

Docelowo mogą być role:

- właściciel,
- pracownik obsługi klienta,
- osoba od zakupów,
- osoba od marketingu,
- tylko podgląd.

### Funkcje użytkowników

- logowanie,
- wylogowanie,
- podstawowe role,
- uprawnienia do modułów,
- historia działań użytkownika.

---

## 17. Powiadomienia

Powiadomienia mają trafiać na Pulpit i do listy alertów.

### Typy powiadomień

- nowa opinia,
- wiadomość bez odpowiedzi,
- nowa dyskusja,
- nowy zwrot,
- nowa reklamacja,
- niski stan magazynowy,
- produkt do zamówienia,
- spadek sprzedaży,
- reklama z niską opłacalnością,
- cena poniżej opłacalności,
- problem z przesyłką.

### Zasada

Nie każde zdarzenie jest alertem.

Alertem jest tylko to, co wymaga reakcji.

---

## 18. Dane testowe

Na początku tworzymy dane testowe zamiast od razu podłączać API.

Dane testowe mają udawać:

- produkty,
- oferty Allegro,
- sprzedaż,
- koszty,
- reklamy,
- opinie,
- wiadomości,
- zamówienia,
- klientów,
- alerty.

Dzięki temu najpierw budujemy wygląd i logikę systemu.

API podłączamy później.

---

## 19. Funkcje niewchodzące do pierwszej wersji

Na start nie robimy:

- pełnej automatycznej zmiany cen,
- pełnej automatycznej obsługi reklamacji,
- zaawansowanej automatyzacji zakupów,
- aplikacji mobilnej,
- mikroserwisów,
- Dockera, jeśli nie będzie potrzebny,
- rozbudowanych ról użytkowników,
- wielu marketplace poza Allegro.

Najpierw robimy prostą działającą wersję.

---

## 20. Pierwsza wersja MVP

Pierwsza wersja MVP ma zawierać:

- layout systemu,
- menu boczne,
- Pulpit z alertami,
- moduł Produkty na danych testowych,
- moduł Rentowność na danych testowych,
- moduł Zamówienia na danych testowych,
- moduł Analizy na danych testowych,
- moduł Oferty Allegro na danych testowych,
- moduł Obsługa klienta na danych testowych,
- moduł Ustawienia,
- podstawową bazę danych,
- możliwość wdrożenia na VPS.

MVP nie musi mieć jeszcze prawdziwego API.

Najpierw ma działać układ i logika.
