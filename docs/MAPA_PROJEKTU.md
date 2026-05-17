# Vunqo — mapa projektu

## 1. Cel systemu

Vunqo to panel webowy do zarządzania sprzedażą, rentownością, ofertami Allegro, stanami magazynowymi, zamówieniami, opiniami i obsługą klienta.

System ma działać jako strona www dostępna przez przeglądarkę, a nie jako aplikacja mobilna.

Docelowo system ma łączyć dane z:

- BaseLinker,

- Allegro,

- PostgreSQL,

- dostawców / hurtowni,

- w przyszłości także sklepów internetowych i innych marketplace.

## 2. Główna zasada projektu

System ma pomagać podejmować decyzje, a nie tylko pokazywać dane.

Najważniejsze pytania, na które Vunqo ma odpowiadać:

- czy produkt się opłaca,

- ile realnie zarabiam na sztuce,

- czy reklama zjada zysk,

- czy trzeba domówić towar,

- ile sztuk zamówić,

- czy sprzedaż produktu spada,

- czy pojawiły się nowe opinie,

- czy klient czeka na odpowiedź,

- czy oferta jest konkurencyjna cenowo,

- czy oferta ma Super Cenę lub inne oznaczenie Allegro.

## 3. Nazwa systemu

Aktualna robocza nazwa systemu:

Vunqo

Nazwa jest krótka, neutralna i nie zawiera słów Allegro ani Boss.

## 4. Główne moduły systemu

Menu systemu:

1. Pulpit

2. Produkty

3. Rentowność

4. Zamówienia

5. Analizy

Sekcja Allegro:

6. Oferty Allegro

7. Promocje i reklamy

8. Konkurencja cenowa

Sekcja Obsługa:

9. Obsługa klienta

Sekcja System:

10. Ustawienia

## 5. Pulpit

Pulpit nie ma być kopią menu w kafelkach.

Pulpit ma być centrum dowodzenia i pokazywać tylko rzeczy wymagające reakcji.

Pulpit odpowiada na pytanie:

Co mam zrobić teraz?

Na Pulpicie mają być:

- sprawy klientów bez odpowiedzi,

- pilne zamówienia,

- produkty z niskim stanem,

- produkty ze spadkiem sprzedaży,

- reklamy do kontroli,

- nowe opinie produktów,

- alerty rentowności,

- lista dzisiejszych zadań.

Zasada:

Jeżeli dana informacja nie pomaga zdecydować, co zrobić teraz, nie powinna być na Pulpicie.

## 6. Produkty

Moduł Produkty to baza towarów pobierana głównie z BaseLinkera.

To nie są jeszcze oferty Allegro, tylko ogólna baza produktów.

W tym module mają być:

- nazwa produktu,

- SKU,

- EAN, jeśli jest,

- cena zakupu,

- stan magazynowy,

- dostawca / hurtownia,

- powiązanie z ofertami Allegro,

- informacja, gdzie produkt jest wystawiony,

- sprzedaż z ostatnich dni,

- informacja, czy produkt wymaga domówienia.

Produkty są źródłem danych magazynowych i zakupowych.

## 7. Oferty Allegro

Oferty Allegro to osobny moduł, ponieważ oferta Allegro nie jest tym samym co produkt w magazynie.

Jedna karta produktu z BaseLinkera może mieć jedną lub kilka ofert Allegro.

W module Oferty Allegro mają być:

- ID oferty Allegro,

- nazwa oferty,

- konto Allegro,

- cena aktualna,

- status oferty,

- powiązany produkt z BaseLinkera,

- Super Cena / oznaczenia Allegro,

- reklama aktywna lub nieaktywna,

- promocje,

- opinie,

- konkurencyjność ceny,

- decyzje cenowe.

Zmiana ceny powinna być robiona przez BaseLinkera, jeśli BaseLinker jest źródłem prawdy dla cen Allegro.

## 8. Rentowność

Moduł Rentowność ma liczyć, ile realnie zostaje na produkcie.

System ma liczyć:

zysk = cena sprzedaży - cena zakupu - prowizja Allegro - reklama - inne koszty

W module mają być:

- cena zakupu,

- aktualna cena sprzedaży,

- prowizja Allegro,

- koszty promocji,

- koszt reklamy,

- inne opłaty Allegro,

- zysk na sztuce,

- marża procentowa,

- minimalna opłacalna cena,

- zysk przy cenie konkurencji,

- informacja: obniżyć / nie obniżać / sprawdzić ręcznie.

System powinien ostrzegać, gdy:

- marża spada poniżej minimum,

- reklama zjada zysk,

- reguła cenowa może zejść poniżej opłacalności,

- produkt sprzedaje się, ale zarobek jest zbyt niski.

## 9. Zamówienia

Moduł Zamówienia nie ogranicza się tylko do jednej hurtowni.

Ma pokazywać, co należy domówić u dostawców.

System ma analizować:

- aktualny stan magazynowy,

- sprzedaż z ostatnich 7 dni,

- sprzedaż z ostatnich 30 dni,

- średnią sprzedaż dzienną,

- prognozę na kolejne 7 / 14 / 30 dni,

- minimalny zapas bezpieczeństwa.

System ma sugerować:

- ile sztuk zamówić,

- na ile dni wystarczy obecny stan,

- które produkty są pilne,

- które mogą poczekać,

- z jakiego źródła najlepiej zamówić produkt.

Przykład:

Jeśli produkt sprzedał się 14 razy przez ostatnie 7 dni, to średnia sprzedaż wynosi 2 sztuki dziennie.

Jeśli na stanie są 4 sztuki, to wystarczy na około 2 dni.

System sugeruje zamówić minimum 14 sztuk na kolejne 7 dni plus zapas.

## 10. Analizy

Moduł Analizy zastępuje nazwę Statystyki.

Analizy mają pokazywać:

- sprzedaż w czasie,

- koszty Allegro,

- prowizje,

- koszty reklam,

- koszty promocji,

- procent kosztów Allegro względem sprzedaży,

- trendy sprzedaży,

- spadki sprzedaży,

- jakość konta Allegro, jeśli API pozwoli,

- porównanie okresów.

W karcie produktu ma być wykres słupkowy sprzedaży dziennej, np. za ostatnie 30 dni.

Wykres ma mieć filtry:

- ostatnie 7 dni,

- ostatnie 14 dni,

- ostatnie 30 dni,

- własny zakres dat,

- konto Allegro,

- produkt,

- kategoria,

- dostawca.

System ma wykrywać spadek sprzedaży.

Przykład:

Produkt sprzedał się w ostatnich 7 dniach 6 razy, a w poprzednich 7 dniach 21 razy.

System pokazuje alert: sprzedaż spadła o 71%.

## 11. Promocje i reklamy

Moduł Promocje i reklamy ma obsługiwać marketing Allegro.

W module mają być:

- wyróżnienia,

- wyróżnienia elastyczne,

- Allegro Ads,

- monety,

- kampanie,

- oznaczenia ofert,

- status kampanii,

- koszt promocji,

- wpływ promocji na zysk.

System ma pokazywać, czy promocja jest opłacalna.

Przykład:

Oferta ma reklamę aktywną.

Koszt reklamy wynosi 3 zł na sztuce.

Zysk po reklamie spada poniżej minimum.

System ostrzega: sprawdź reklamę albo zmień cenę.

## 12. Konkurencja cenowa

Moduł Konkurencja cenowa ma analizować pozycję oferty względem innych ofert Allegro.

Jeżeli Allegro API pozwoli, system ma pobierać:

- najniższą cenę w produkcie,

- cenę konkurencji,

- cenę całkowitą z dostawą,

- status Super Cena,

- inne oznaczenia Allegro,

- reguły cenowe,

- minimalny i maksymalny zakres ceny.

System ma liczyć:

- różnicę między moją ceną a najniższą ceną,

- zysk przy zejściu do ceny konkurencji,

- czy można obniżyć cenę,

- czy nie wolno schodzić niżej.

Przykład decyzji:

Możesz zejść z ceną o 2 zł i nadal zarobisz 10,60 zł na sztuce.

Albo:

Nie schodź do najniższej ceny, bo po prowizji i koszcie zakupu będziesz poniżej minimum.

## 13. Opinie produktów

Opinie nie mają być osobną główną zakładką w menu.

Opinie mają być widoczne w karcie Oferty Allegro.

System ma pokazywać:

- liczbę opinii,

- średnią ocenę,

- datę opinii,

- liczbę gwiazdek,

- treść opinii,

- powiązany produkt/ofertę,

- czy opinia jest nowa,

- czy opinia wymaga reakcji.

System ma tworzyć powiadomienie, gdy pojawi się nowa opinia.

Przykład:

Nowa opinia 3 gwiazdki: klient zgłasza problem z opakowaniem.

System tworzy alert na Pulpicie.

## 14. Obsługa klienta

Obsługa klienta ma być jednym centrum spraw.

W środku mają być przełączniki / chipy:

- Wiadomości,

- Dyskusje,

- Zwroty,

- Reklamacje,

- Przesyłki,

- Kartoteka klienta.

Przy chipach mają być liczniki, np.:

- Wiadomości 4,

- Dyskusje 2,

- Zwroty 3,

- Reklamacje 1,

- Przesyłki 5.

Nie dublujemy tych liczb dużymi kafelkami pod spodem.

W module mają być:

- komunikacja z klientem,

- wiadomości,

- dyskusje Allegro,

- zwroty,

- reklamacje,

- statusy przesyłek,

- linki śledzące,

- dane zamówienia,

- historia klienta,

- możliwość odpowiedzi z poziomu systemu.

## 15. Kartoteka klienta

Kartoteka klienta ma pokazywać pełny kontekst kupującego.

W kartotece mają być:

- dane klienta,

- e-mail Allegro,

- liczba zamówień,

- wartość zamówień,

- historia zakupów,

- status płatności,

- historia zwrotów,

- historia reklamacji,

- historia dyskusji,

- status aktualnej przesyłki,

- informacja, czy klient jest powracający.

Cel:

Jeżeli klient jest stały i coś poszło nie tak, można obsłużyć go lepiej, np. szybciej pomóc, dodać gratis albo rabat.

## 16. Ustawienia

Połączenia API nie są osobnym modułem w menu.

Połączenia API są częścią Ustawień.

W Ustawieniach mają być:

- Wygląd,

- API i połączenia,

- Konta Allegro,

- Powiadomienia,

- Użytkownicy,

- Reguły systemu.

Ustawienia wyglądu:

- motyw jasny / ciemny,

- kolor główny systemu,

- gęstość tabel,

- widok startowy,

- układ menu.

API i połączenia:

- BaseLinker API,

- Allegro API,

- konta Allegro,

- dostawcy / hurtownie,

- przyszłe sklepy internetowe.

Reguły systemu:

- minimalny zysk na sztuce,

- minimalna marża procentowa,

- okres do zamówień,

- próg alertu spadku sprzedaży,

- zasada zmiany cen przez BaseLinkera.

## 17. Integracje

Główne integracje:

### BaseLinker

Z BaseLinkera pobieramy:

- produkty,

- SKU,

- ceny zakupu,

- stany magazynowe,

- powiązania z ofertami,

- dane sprzedażowe, jeśli dostępne.

Do BaseLinkera możemy wysyłać:

- zmianę ceny,

- ewentualne aktualizacje danych, jeśli będzie to bezpieczne.

BaseLinker ma być źródłem prawdy dla stanów i cen, jeśli tak działa obecny proces.

### Allegro

Z Allegro pobieramy:

- oferty,

- ceny,

- prowizje,

- koszty sprzedaży,

- reklamy,

- kampanie,

- opinie,

- wiadomości,

- dyskusje,

- zwroty,

- reklamacje,

- dane zamówień,

- statusy przesyłek,

- dane jakości konta, jeśli API pozwoli.

Do Allegro możemy wysyłać:

- odpowiedzi do klientów,

- decyzje w obsłudze klienta,

- działania marketingowe,

- akcje kampanii, jeśli API pozwoli.

### PostgreSQL

Baza danych przechowuje dane systemu:

- produkty,

- oferty,

- historię cen,

- historię sprzedaży,

- koszty,

- alerty,

- klientów,

- opinie,

- zamówienia,

- ustawienia,

- logi synchronizacji.

### VPS OVH

Serwer VPS służy do uruchomienia aplikacji online.

Na VPS jest przygotowane:

- Debian 13,

- Nginx,

- Node.js,

- pnpm,

- PM2,

- PostgreSQL,

- Git,

- firewall,

- baza danych `vunqo_db`,

- użytkownik bazy `vunqo_user`.

## 18. Technologia

Aplikacja ma być panelem webowym.

Proponowany stos technologiczny:

- Next.js,

- TypeScript,

- Tailwind CSS,

- PostgreSQL,

- Prisma,

- NextAuth albo inny system logowania,

- PM2 na serwerze,

- Nginx jako reverse proxy.

## 19. Zasady pracy

Nie programujemy bezpośrednio na VPS.

Schemat pracy:

1. Kod powstaje lokalnie w Cursorze.

2. Kod trafia na GitHub.

3. VPS pobiera kod z GitHuba.

4. Aplikacja działa online na VPS.

VPS nie jest miejscem do codziennego pisania kodu.

VPS jest miejscem uruchamiania gotowej aplikacji.

## 20. Zasada dla AI / Cursora

AI nie może samodzielnie zmieniać głównych założeń systemu bez zgody właściciela projektu.

Jeżeli trzeba zmienić logikę biznesową, menu, integracje lub sposób liczenia zysku, AI ma najpierw zaproponować zmianę i czekać na akceptację.

Najpierw robimy prostą, działającą wersję.

Potem rozbudowujemy.

## 21. Etapy realizacji

Etap 1:

- dokumentacja projektu,

- mapa systemu,

- podstawowy projekt Next.js,

- połączenie z bazą danych,

- podstawowy layout panelu.

Etap 2:

- moduł Produkty,

- baza produktów,

- ręczne dane testowe,

- pierwsze tabele i filtry.

Etap 3:

- BaseLinker API,

- pobieranie produktów,

- pobieranie stanów,

- pobieranie cen zakupu.

Etap 4:

- Allegro API,

- pobieranie ofert,

- ceny,

- koszty,

- statusy ofert.

Etap 5:

- rentowność,

- marża,

- zysk,

- alerty opłacalności.

Etap 6:

- zamówienia,

- prognozy,

- sugestie ilości do zamówienia.

Etap 7:

- obsługa klienta,

- wiadomości,

- dyskusje,

- zwroty,

- reklamacje.

Etap 8:

- opinie,

- powiadomienia,

- analiza opinii.

Etap 9:

- marketing,

- promocje,

- reklamy,

- analiza opłacalności.

Etap 10:

- wdrożenie na VPS,

- domena,

- SSL,

- backup,

- zabezpieczenia.

## 22. Ostatnia aktualna makieta

Aktualna makieta HTML:

Vunqo — makieta v12 — Pulpit jako alerty i priorytety

Plik makiety był przygotowany jako:

vunqo_makieta_v12_pulpit_alerty.html