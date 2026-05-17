# Zasady dla AI / Cursora / Codexa — projekt Vunqo

## 1. Najważniejsza zasada

AI ma pomagać budować system Vunqo zgodnie z dokumentacją projektu.

Głównym źródłem prawdy jest plik:

docs/MAPA_[PROJEKTU.md](http://PROJEKTU.md)

Jeżeli opis w rozmowie, kodzie i dokumentacji się różni, pierwszeństwo ma aktualna mapa projektu.

## 2. Nie zmieniaj założeń bez zgody

AI nie może samodzielnie zmieniać:

- nazwy systemu,

- struktury menu,

- znaczenia modułów,

- sposobu liczenia rentowności,

- założeń integracji z BaseLinkerem,

- założeń integracji z Allegro,

- sposobu działania Pulpitu,

- zasad obsługi klienta,

- sposobu aktualizacji cen,

- struktury bazy danych po jej zatwierdzeniu.

Jeżeli zmiana jest potrzebna, AI ma najpierw zaproponować zmianę i wyjaśnić, dlaczego jest potrzebna.

## 3. Projekt budujemy etapami

Nie budujemy wszystkiego naraz.

Najpierw:

1. dokumentacja,

2. podstawowy projekt Next.js,

3. layout panelu,

4. podstawowa baza danych,

5. dane testowe,

6. moduł Produkty,

7. moduł Rentowność,

8. moduł Zamówienia,

9. moduły Allegro,

10. integracje API.

## 4. Najpierw prosta działająca wersja

AI ma najpierw proponować najprostsze działające rozwiązanie.

Nie wolno na początku komplikować projektu niepotrzebnymi mikroserwisami, kolejkami, kontenerami i nadmiarową architekturą.

Najpierw ma działać lokalnie w Cursorze.

Dopiero później wdrażamy na VPS.

## 5. VPS nie jest miejscem do kodowania

Kod powstaje lokalnie w Cursorze.

Schemat pracy:

Cursor lokalnie → GitHub → VPS

Na VPS aplikacja ma być tylko uruchamiana.

Nie należy ręcznie pisać kodu na VPS, chyba że chodzi o konfigurację serwera.

## 6. Technologia projektu

Preferowany stos technologiczny:

- Next.js,

- TypeScript,

- Tailwind CSS,

- PostgreSQL,

- Prisma,

- NextAuth albo inny system logowania,

- PM2,

- Nginx.

Jeżeli AI chce użyć innej technologii, musi najpierw uzasadnić zmianę.

## 7. Nazewnictwo modułów

Aktualne menu systemu:

- Pulpit,

- Produkty,

- Rentowność,

- Zamówienia,

- Analizy,

- Oferty Allegro,

- Promocje i reklamy,

- Konkurencja cenowa,

- Obsługa klienta,

- Ustawienia.

Nie używać osobnego modułu „Połączenia API” w głównym menu.

Połączenia API są częścią Ustawień.

## 8. Pulpit

Pulpit nie jest kopią menu.

Pulpit ma pokazywać wyłącznie:

- priorytety,

- alerty,

- sprawy bez odpowiedzi,

- produkty do pilnego zamówienia,

- spadki sprzedaży,

- reklamy z niską opłacalnością,

- nowe opinie,

- zadania na teraz.

Jeżeli dana informacja nie pomaga zdecydować „co zrobić teraz”, nie powinna być na Pulpicie.

## 9. Produkty i Oferty Allegro to nie to samo

Produkty = baza towarów z BaseLinkera.

Oferty Allegro = konkretne aukcje/oferty na Allegro.

Nie mieszać tych pojęć.

Produkt może być powiązany z jedną lub wieloma ofertami Allegro.

## 10. Ceny

Jeżeli BaseLinker zarządza ofertami Allegro, to zmiana ceny powinna iść przez BaseLinkera.

System Vunqo może analizować i sugerować cenę, ale nie powinien bez zgody zmieniać ceny bezpośrednio na Allegro, jeśli spowoduje to rozjazd z BaseLinkerem.

## 11. Rentowność

Podstawowy wzór:

zysk = cena sprzedaży - cena zakupu - prowizje Allegro - reklama - inne koszty

System musi jasno pokazywać, skąd bierze się wynik.

Nie wolno ukrywać kosztów w jednej niejasnej liczbie.

## 12. Obsługa klienta

Obsługa klienta ma być jednym panelem.

W środku mają być chipy:

- Wiadomości,

- Dyskusje,

- Zwroty,

- Reklamacje,

- Przesyłki,

- Kartoteka klienta.

Przy chipach mają być małe liczniki.

Nie dublować tych liczników dużymi kafelkami.

## 13. Ustawienia

Ustawienia obejmują:

- wygląd,

- kolorystykę,

- API i połączenia,

- konta Allegro,

- powiadomienia,

- użytkowników,

- reguły systemu.

## 14. Styl interfejsu

Interfejs ma być prosty, czytelny i praktyczny.

Właściciel systemu nie jest programistą.

Unikać technicznego żargonu w widocznych nazwach.

Lepiej używać nazw:

- Pulpit,

- Produkty,

- Zamówienia,

- Analizy,

- Ustawienia,

niż nazw technicznych typu:

- database,

- API manager,

- entities,

- sync jobs.

## 15. Bezpieczeństwo

Nie wpisywać kluczy API bezpośrednio w kodzie.

Sekrety i klucze mają być w pliku .env.

Plik .env nie może trafić na GitHub.

Do repozytorium powinien trafić tylko przykład:

.env.example

## 16. Przed zmianą większego kodu

AI powinno najpierw wyjaśnić:

- co chce zmienić,

- po co,

- jakie pliki będą zmienione,

- czy zmiana wpływa na bazę danych,

- czy zmiana wpływa na mapę projektu.

## 17. Komunikacja z użytkownikiem

Do właściciela projektu pisać prostym językiem.

Nie zakładać, że użytkownik zna programowanie.

Tłumaczyć krok po kroku.

Nie podawać naraz zbyt wielu komend, jeśli użytkownik wykonuje konfigurację ręcznie.