// Talent Detector - Kalibracja - Uproszczona wersja

// Prosta implementacja getCategory dla CalibrationModule
class SimpleTalentDetector {
    getCategory(employee) {
        // Convert average scores to levels using thresholds with detailed rules
        const perfRatings = employee.performanceDetails ? Object.values(employee.performanceDetails) : [];
        const potRatings = employee.potentialDetails ? Object.values(employee.potentialDetails) : [];
        
        const perfLevel = this.scaleToLevel(employee.performance, perfRatings);
        const potLevel = this.scaleToLevel(employee.potential, potRatings);

        const categories = {
            '3-3': { label: 'Q9 Gwiazda', description: 'Wysokie wyniki + wysoki potencjał - najcenniejsze talenty organizacji' },
            '3-2': { label: 'Q8 High Performer', description: 'Wysokie wyniki + średni potencjał - eksperci w swojej roli' },
            '3-1': { label: 'Q7 Ekspert', description: 'Wysokie wyniki + niski potencjał - solidni wykonawcy bez ambicji awansu' },
            '2-3': { label: 'Q6 Przyszła gwiazda', description: 'Średnie wyniki + wysoki potencjał - talenty wymagające rozwoju' },
            '2-2': { label: 'Q5 Kluczowy pracownik', description: 'Średnie wyniki + średni potencjał - stabilny rdzeń organizacji' },
            '2-1': { label: 'Q4 Rzetelny wykonawca', description: 'Średnie wyniki + niski potencjał - wykonawcy rutynowych zadań' },
            '1-3': { label: 'Q3 Enigma', description: 'Niskie wyniki + wysoki potencjał - niewykorzystany potencjał lub źle dopasowana rola' },
            '1-2': { label: 'Q2 Niekonsekwentny', description: 'Niskie wyniki + średni potencjał - wymagają wsparcia i struktury' },
            '1-1': { label: 'Q1 Słaby wykonawca', description: 'Niskie wyniki + niski potencjał - wymaga Performance Improvement Plan' }
        };

        return categories[`${perfLevel}-${potLevel}`] || { label: 'Nieokreślony', description: 'Brak wystarczających danych' };
    }

    scaleToLevel(avgValue, ratings = []) {
        // Zaawansowane reguły kategoryzacji (skala 1-5 dla avgValue, 1-4 dla ratings)
        // WYSOKI: Średnia >3,3 ORAZ brak oceny "1"
        // NISKI: Średnia < 2.5 ORAZ liczba ocen mniejszych niż 3 jest większa lub równa 3
        // ŚREDNI: pozostałe przypadki
        
        if (ratings.length > 0) {
            const hasRatingOne = ratings.some(r => r === 1);
            const lowRatingsCount = ratings.filter(r => r < 3).length;
            
            console.log(`🔍 Zaawansowana kategoryzacja: avgValue=${avgValue.toFixed(2)}, ratings=[${ratings}], hasRatingOne=${hasRatingOne}, lowRatingsCount=${lowRatingsCount}`);
            
            // Wysoki: Średnia >3.3 ORAZ brak oceny "1"
            if (avgValue > 3.3 && !hasRatingOne) {
                console.log(`✅ WYSOKI poziom (avgValue=${avgValue.toFixed(2)} > 3.3, brak oceny "1")`);
                return 3;
            }
            
            // Niski: Średnia < 2.5 ORAZ liczba ocen <3 jest >= 3
            if (avgValue < 2.5 && lowRatingsCount >= 3) {
                console.log(`⬇️ NISKI poziom (avgValue=${avgValue.toFixed(2)} < 2.5, ${lowRatingsCount} ocen <3)`);
                return 1;
            }
            
            // Średni: wszystko inne
            console.log(`🔶 ŚREDNI poziom (warunki WYSOKI i NISKI nie spełnione)`);
            return 2;
        }
        
        // Fallback: prosta logika gdy brak szczegółowych ocen
        console.log(`⚠️ Fallback - brak szczegółowych ocen, avgValue=${avgValue.toFixed(2)}`);
        if (avgValue <= 2.5) return 1;
        if (avgValue <= 3.5) return 2;
        return 3;
    }
}

class CalibrationModule {
    constructor(talentDetector) {
        console.log('CalibrationModule constructor called');
        this.talentDetector = talentDetector;
        this.caseAssessments = this.loadAssessments();
        this.benchmarkScores = this.getBenchmarkScores();
        console.log('Calling init()...');
        this.init();
    }

    init() {
        console.log('CalibrationModule.init() called');
        this.initializeCaseForms();
    }

    initializeCaseForms() {
        // Initialize forms for all 5 cases immediately
        for (let caseId = 1; caseId <= 5; caseId++) {
            const assessmentDiv = document.getElementById(`assessment-case${caseId}`);
            if (assessmentDiv) {
                assessmentDiv.innerHTML = this.generateAssessmentForm(caseId);
                this.setupAssessmentFormListeners(caseId);
            }
        }
        // Setup tooltips after all forms are generated
        this.setupCalibrationTooltips();
    }

    generateAssessmentForm(caseId) {
        const tooltips = {
            perf_q1: {
                1: { title: 'Poniżej oczekiwań - przykłady:', items: ['cele są realizowane rzadko lub w ograniczonym zakresie,', 'pojawiają się istotne trudności z dowożeniem wyników nawet w sprzyjających warunkach,', 'wymagane jest częste wsparcie lub interwencja, aby osiągnąć podstawowe rezultaty.'] },
                2: { title: 'Częściowo spełnia oczekiwania - przykłady:', items: ['realizuje cele nieregularnie lub z opóźnieniami,', 'dowozi wyniki w sprzyjających warunkach, ale ma trudność w sytuacjach bardziej wymagających,', 'potrzebuje wsparcia w priorytetyzacji lub egzekucji zadań, aby osiągnąć zakładane rezultaty.'] },
                3: { title: 'Spełnia oczekiwania - przykłady:', items: ['realizuje uzgodnione cele zgodnie z planem i priorytetami,', 'dowozi wyniki w typowych warunkach pracy dla danej roli,', 'bierze odpowiedzialność za własny zakres zadań i terminowo je realizuje.'] },
                4: { title: 'Powyżej oczekiwań - przykłady:', items: ['regularnie osiąga lub przekracza cele w sytuacjach trudniejszych niż standardowe (np. ograniczone zasoby, presja czasu),', 'dowozi kluczowe rezultaty również wtedy, gdy warunki się zmieniają lub cele są niejednoznaczne,', 'bierze odpowiedzialność za wynik zespołu lub obszaru, a nie tylko własny zakres zadań.'] }
            },
            perf_q2: {
                1: { title: 'Poniżej oczekiwań - przykłady:', items: ['jakość pracy często nie spełnia ustalonych standardów,', 'błędy pojawiają się regularnie i wymagają poprawek ze strony innych,', 'procedury lub dobre praktyki nie są stosowane konsekwentnie.'] },
                2: { title: 'Częściowo spełnia oczekiwania - przykłady:', items: ['jakość pracy jest nierówna i wymaga poprawek częściej niż zakłada standard roli,', 'popełnia błędy, które są korygowane dopiero po zwróceniu uwagi,', 'nie zawsze konsekwentnie stosuje ustalone procedury lub dobre praktyki.'] },
                3: { title: 'Spełnia oczekiwania - przykłady:', items: ['dostarcza pracę zgodną z wymaganiami i standardami jakości,', 'popełnia sporadyczne błędy, które są szybko korygowane,', 'stosuje ustalone procedury i dobre praktyki.'] },
                4: { title: 'Powyżej oczekiwań - przykłady:', items: ['dostarcza pracę o wysokiej jakości bez potrzeby poprawek, także przy złożonych lub nowych zadaniach,', 'sam/a identyfikuje ryzyka jakościowe i zapobiega błędom, zanim się pojawią,', 'podnosi standard jakości w zespole (np. proponuje usprawnienia, checklisty, dobre praktyki).'] }
            },
            perf_q3: {
                1: { title: 'Poniżej oczekiwań - przykłady:', items: ['zobowiązania nie są realizowane terminowo lub w pełnym zakresie,', 'trudno przewidzieć poziom realizacji zadań,', 'konieczna jest stała kontrola lub przypominanie, aby zadania zostały wykonane.'] },
                2: { title: 'Częściowo spełnia oczekiwania - przykłady:', items: ['wywiązuje się z ustaleń, ale nie zawsze terminowo lub w pełnym zakresie,', 'wymaga przypomnień lub kontroli, aby domykać zadania,', 'poziom realizacji zadań jest zmienny w czasie.'] },
                3: { title: 'Spełnia oczekiwania - przykłady:', items: ['jest terminowa/y i wywiązuje się z ustaleń,', 'można na niej/nim polegać w codziennej pracy,', 'utrzymuje przewidywalny poziom realizacji zadań.'] },
                4: { title: 'Powyżej oczekiwań - przykłady:', items: ['można na niej/nim polegać w krytycznych momentach lub projektach o wysokiej wadze,', 'samodzielnie organizuje pracę i wsparcie, bez potrzeby stałej kontroli,', 'utrzymuje stabilny poziom dowożenia nawet przy dużym obciążeniu lub niepewności.'] }
            },
            perf_q4: {
                1: { title: 'Poniżej oczekiwań - przykłady:', items: ['presja lub zmiana wyraźnie obniżają skuteczność działania,', 'adaptacja do nowych warunków jest trudna nawet przy jasnych wytycznych,', 'napięcie wpływa na jakość pracy lub współpracę z innymi.'] },
                2: { title: 'Częściowo spełnia oczekiwania - przykłady:', items: ['radzi sobie z presją w prostych, przewidywalnych sytuacjach,', 'potrzebuje czasu lub dodatkowego wsparcia, aby zaadaptować się do zmian,', 'w sytuacjach napięcia traci chwilowo skuteczność lub pewność działania.'] },
                3: { title: 'Spełnia oczekiwania - przykłady:', items: ['zachowuje skuteczność w standardowych sytuacjach presji,', 'adaptuje się do zmian po otrzymaniu jasnych wytycznych,', 'nie przenosi napięcia na innych i zachowuje profesjonalizm.'] },
                4: { title: 'Powyżej oczekiwań - przykłady:', items: ['zachowuje skuteczność i spokój w sytuacjach dużej presji lub chaosu,', 'szybko adaptuje się do zmian i pomaga innym odnaleźć się w nowej sytuacji,', 'potrafi podejmować dobre decyzje mimo niepełnych informacji.'] }
            },
            perf_q5: {
                1: { title: 'Poniżej oczekiwań - przykłady:', items: ['współpraca z innymi jest ograniczona lub utrudniona,', 'informacje nie są przekazywane w sposób wystarczający do realizacji zadań,', 'relacje robocze wymagają wsparcia lub moderacji.'] },
                2: { title: 'Częściowo spełnia oczekiwania - przykłady:', items: ['współpracuje poprawnie, ale głównie w swoim bezpośrednim zakresie,', 'dzieli się informacjami, gdy zostanie o to poproszona/y,', 'rzadko inicjuje współpracę lub wsparcie dla innych.'] },
                3: { title: 'Spełnia oczekiwania - przykłady:', items: ['współpracuje w sposób otwarty i profesjonalny,', 'dzieli się informacjami potrzebnymi do realizacji zadań,', 'respektuje role i ustalenia zespołowe.'] },
                4: { title: 'Powyżej oczekiwań - przykłady:', items: ['realnie wpływa na jakość współpracy w zespole lub między zespołami,', 'dzieli się wiedzą i doświadczeniem w sposób, który przyspiesza pracę innych,', 'jest naturalnym „punktem odniesienia" lub partnerem do rozwiązywania trudnych tematów.'] }
            },
            perf_q6: {
                1: { title: 'Poniżej oczekiwań - przykłady:', items: ['komunikacja jest ograniczona, niejasna lub niespójna,', 'informacje są przekazywane wybiórczo, z opóźnieniem lub po fakcie,', 'sposób komunikacji utrudnia współpracę lub prowadzi do nieporozumień,', 'reagowanie na informację zwrotną jest defensywne lub minimalne.'] },
                2: { title: 'Częściowo spełnia oczekiwania - przykłady:', items: ['komunikuje się poprawnie w prostych, rutynowych sytuacjach,', 'przekazuje informacje, gdy jest o to poproszona/y, ale rzadko inicjuje komunikację,', 'otwartość i współpraca są nierówne i zależne od kontekstu lub relacji,', 'przyjmuje informację zwrotną, ale nie zawsze przekłada ją na zmianę zachowania.'] },
                3: { title: 'Spełnia oczekiwania - przykłady:', items: ['komunikuje się w sposób jasny, otwarty i z szacunkiem,', 'regularnie wymienia się informacjami niezbędnymi do realizacji zadań,', 'współpracuje konstruktywnie z innymi,', 'przyjmuje informację zwrotną i reaguje na nią w profesjonalny sposób.'] },
                4: { title: 'Powyżej oczekiwań - przykłady:', items: ['aktywnie dba o jakość komunikacji w zespole lub między zespołami,', 'jasno formułuje oczekiwania, słucha i dopasowuje styl komunikacji do rozmówcy,', 'inicjuje otwartą wymianę informacji i informacji zwrotnej,', 'zapobiega nieporozumieniom i wspiera innych w skutecznej współpracy.'] }
            },
            pot_q7: {
                1: { title: 'Poniżej oczekiwań - przykłady:', items: ['przyswajanie nowych umiejętności jest znacząco wolniejsze niż zakłada standard roli,', 'trudności pojawiają się w przełożeniu wiedzy na praktykę,', 'informacja zwrotna nie prowadzi do zauważalnej zmiany sposobu działania.'] },
                2: { title: 'Częściowo spełnia oczekiwania - przykłady:', items: ['uczy się nowych umiejętności wolniej niż zakłada standard roli,', 'potrzebuje dodatkowego czasu lub wsparcia, aby przełożyć wiedzę na praktykę,', 'reaguje na informację zwrotną, ale nie zawsze wdraża ją konsekwentnie.'] },
                3: { title: 'Spełnia oczekiwania - przykłady:', items: ['przyswaja nowe umiejętności w tempie odpowiednim dla roli,', 'stosuje zdobytą wiedzę w praktyce po okresie wdrożenia,', 'reaguje konstruktywnie na informację zwrotną.'] },
                4: { title: 'Powyżej oczekiwań - przykłady:', items: ['bardzo szybko przyswaja nowe umiejętności i skutecznie stosuje je w praktyce,', 'sam/a aktywnie poszukuje nowych obszarów rozwoju bez formalnego impulsu,', 'uczy się na błędach i wyraźnie zmienia sposób działania na przyszłość.'] }
            },
            pot_q8: {
                1: { title: 'Poniżej oczekiwań - przykłady:', items: ['zainteresowanie rozwojem jest ograniczone lub krótkotrwałe,', 'cele rozwojowe nie są realizowane nawet przy wsparciu,', 'rzadko pojawia się gotowość do podejmowania nowych wyzwań.'] },
                2: { title: 'Częściowo spełnia oczekiwania - przykłady:', items: ['deklaruje chęć rozwoju, ale działania rozwojowe są nieregularne,', 'realizuje cele rozwojowe głównie po zewnętrznym impulsie,', 'rzadko samodzielnie zgłasza gotowość do podejmowania nowych wyzwań.'] },
                3: { title: 'Spełnia oczekiwania - przykłady:', items: ['wykazuje zainteresowanie rozwojem w ramach obecnej roli,', 'realizuje uzgodnione cele rozwojowe,', 'jest otwarta/y na nowe zadania, gdy się pojawiają.'] },
                4: { title: 'Powyżej oczekiwań - przykłady:', items: ['jasno komunikuje chęć rozwoju i bierze odpowiedzialność za własną ścieżkę,', 'podejmuje się trudniejszych zadań lub wyzwań wykraczających poza aktualną rolę,', 'konsekwentnie inwestuje czas i energię w rozwój kompetencji.'] }
            },
            pot_q9: {
                1: { title: 'Poniżej oczekiwań - przykłady:', items: ['koncentracja pozostaje niemal wyłącznie na bieżących zadaniach,', 'trudne jest dostrzeganie szerszego kontekstu działań,', 'inicjatywa w zakresie usprawnień lub nowych rozwiązań praktycznie się nie pojawia.'] },
                2: { title: 'Częściowo spełnia oczekiwania - przykłady:', items: ['koncentruje się głównie na bieżących zadaniach,', 'dostrzega szerszy kontekst dopiero po jego wskazaniu,', 'rzadko proponuje usprawnienia lub nowe rozwiązania z własnej inicjatywy.'] },
                3: { title: 'Spełnia oczekiwania - przykłady:', items: ['rozumie kontekst swoich działań i ich wpływ na cele zespołu,', 'proponuje usprawnienia w swoim obszarze odpowiedzialności,', 'działa zgodnie z przyjętymi kierunkami i priorytetami.'] },
                4: { title: 'Powyżej oczekiwań - przykłady:', items: ['widzi zależności i konsekwencje działań w szerszym kontekście biznesowym,', 'proponuje rozwiązania, które realnie usprawniają procesy lub sposób działania,', 'nie ogranicza się do „jak jest", lecz aktywnie szuka „jak może być lepiej".'] }
            },
            pot_q10: {
                1: { title: 'Poniżej oczekiwań - przykłady:', items: ['unika odpowiedzialności wykraczającej poza podstawowy zakres zadań,', 'komunikacja nie wspiera budowania zaangażowania lub jasności działań,', 'nie przejawia gotowości do pełnienia ról wymagających większego wpływu.'] },
                2: { title: 'Częściowo spełnia oczekiwania - przykłady:', items: ['potrafi wziąć odpowiedzialność za zadanie po wyraźnym wskazaniu,', 'komunikuje się poprawnie, ale ma trudność z wywieraniem wpływu,', 'niechętnie wychodzi poza formalnie przypisany zakres roli.'] },
                3: { title: 'Spełnia oczekiwania - przykłady:', items: ['potrafi wziąć odpowiedzialność za zadanie lub fragment pracy zespołu,', 'komunikuje się jasno i konstruktywnie,', 'jest gotowa/y do rozwoju w kierunku większego wpływu, jeśli zajdzie taka potrzeba.'] },
                4: { title: 'Powyżej oczekiwań - przykłady:', items: ['naturalnie bierze odpowiedzialność za innych, nawet bez formalnej roli lidera,', 'potrafi motywować, porządkować pracę lub integrować ludzi wokół celu,', 'jest postrzegana/y przez innych jako autorytet lub osoba, za którą „chce się iść".'] }
            },
            pot_q11: {
                1: { title: 'Poniżej oczekiwań - przykłady:', items: ['nawet umiarkowana złożoność zadań powoduje trudności w działaniu,', 'problemy są rozwiązywane fragmentarycznie lub chaotycznie,', 'często potrzebne jest intensywne wsparcie przy podejmowaniu decyzji.'] },
                2: { title: 'Częściowo spełnia oczekiwania - przykłady:', items: ['radzi sobie z prostymi lub dobrze zdefiniowanymi problemami,', 'ma trudność z porządkowaniem wielu wątków jednocześnie,', 'często potrzebuje wsparcia przy zadaniach nietypowych lub niejednoznacznych.'] },
                3: { title: 'Spełnia oczekiwania - przykłady:', items: ['radzi sobie z typową złożonością zadań w ramach roli,', 'porządkuje informacje i podejmuje logiczne decyzje,', 'korzysta ze wsparcia lub konsultacji w sytuacjach nietypowych.'] },
                4: { title: 'Powyżej oczekiwań - przykłady:', items: ['skutecznie radzi sobie z wielowątkowymi, niejednoznacznymi problemami,', 'łączy różne perspektywy (biznesowe, operacyjne, ludzkie) w spójne rozwiązania,', 'stopniowo przejmuje odpowiedzialność za coraz bardziej złożone zadania lub decyzje.'] }
            },
            pot_q12: {
                1: { title: 'Poniżej oczekiwań - przykłady:', items: ['działa głównie reaktywnie i oczekuje szczegółowych instrukcji,', 'rzadko przejmuje inicjatywę lub odpowiedzialność za sposób realizacji zadań,', 'ma trudność z samodzielnym rozwiązywaniem problemów,', 'nie wykazuje zainteresowania usprawnianiem pracy własnej ani zespołu.'] },
                2: { title: 'Częściowo spełnia oczekiwania - przykłady:', items: ['przejmuje inicjatywę w prostych lub dobrze znanych obszarach,', 'potrafi działać samodzielnie po otrzymaniu jasnych ram lub wskazówek,', 'zgłasza pomysły usprawnień sporadycznie lub po zachęcie,', 'w nowych lub niejednoznacznych sytuacjach waha się przed podjęciem działania.'] },
                3: { title: 'Spełnia oczekiwania - przykłady:', items: ['samodzielnie organizuje swoją pracę i realizuje zadania w ramach roli,', 'podejmuje inicjatywę w obszarach, za które odpowiada,', 'aktywnie poszukuje sposobów usprawnienia własnej pracy,', 'reaguje na problemy bez konieczności stałego nadzoru.'] },
                4: { title: 'Powyżej oczekiwań - przykłady:', items: ['konsekwentnie przejmuje odpowiedzialność za efekty, nie tylko za zadania,', 'inicjuje działania wykraczające poza obecny zakres roli,', 'proponuje i wdraża usprawnienia o realnym wpływie na zespół lub obszar,', 'zachęca innych do działania i buduje poczucie sprawczości wokół siebie.'] }
            }
        };

        const questions = {
            perf: [
                { id: 'perf_q1', label: '1. Dostarczanie wyników', desc: 'Pracownik osiąga wyniki zgodne z celami i oczekiwaniami stanowiska' },
                { id: 'perf_q2', label: '2. Jakość i dokładność pracy', desc: 'Jakość pracy i dokładność wykonania zadań są na wysokim poziomie' },
                { id: 'perf_q3', label: '3. Niezawodność i konsekwencja', desc: 'Pracownik działa niezależnie / samodzielnie bądź samodzielnie znajduje odpowiednie wsparcie' },
                { id: 'perf_q4', label: '4. Radzenie sobie z presją i zmianą', desc: 'Skutecznie radzi sobie w sytuacjach presji, zmian i niejednoznaczności' },
                { id: 'perf_q5', label: '5. Współpraca i wpływ na innych', desc: 'Wnosi pozytywny wpływ na zespół – wspiera, dzieli się wiedzą, inspiruje innych' },
                { id: 'perf_q6', label: '6. Komunikacja', desc: 'Pracownik chętnie współpracuje z innymi, okazuje szacunek, komunikuje się otwarcie oraz aktywnie wymienia się informacją zwrotną' }
            ],
            pot: [
                { id: 'pot_q7', label: '7. Zdolność uczenia się i adaptacji', desc: 'Szybko przyswaja nowe umiejętności i adaptuje się do zmian' },
                { id: 'pot_q8', label: '8. Ambicja i motywacja do rozwoju', desc: 'Wykazuje chęć rozwoju i podejmowania nowych wyzwań' },
                { id: 'pot_q9', label: '9. Myślenie strategiczne i innowacyjność', desc: 'Rozumie szerszy kontekst biznesowy i proponuje nowe rozwiązania' },
                { id: 'pot_q10', label: '10. Potencjał przywódczy i wpływ', desc: 'Potrafi brać odpowiedzialność i wywierać pozytywny wpływ na innych' },
                { id: 'pot_q11', label: '11. Kompleksowość', desc: 'Radzi sobie ze złożonymi, wielowątkowymi problemami' },
                { id: 'pot_q12', label: '12. Samodzielność i inicjatywa', desc: 'Działa proaktywnie i przejmuje odpowiedzialność za rezultaty' }
            ]
        };

        let html = `
            <div class="calibration-form">
                <h4>📝 Oceń case study używając skali 1-4:</h4>
                <p class="help-text">Najedź na cyfry aby zobaczyć szczegółowy opis każdego poziomu oceny</p>
                
                <form id="calibration-form-${caseId}">
                    <div class="calibration-questions">
                        <div class="calibration-section">
                            <h4>Performance:</h4>`;
        
        questions.perf.forEach(q => {
            html += `
                <div class="calibration-question-item">
                    <label>${q.label}:</label>
                    <p class="question-description">${q.desc}</p>
                    <div class="rating-options-with-tooltips">`;
            
            for (let i = 1; i <= 4; i++) {
                const tooltip = tooltips[q.id][i];
                html += `
                        <label class="radio-label-cal has-tooltip-cal">
                            <input type="radio" name="case${caseId}_${q.id}" value="${i}" ${i === 1 ? 'required' : ''}>
                            <span class="radio-text">${i}</span>
                            <div class="custom-tooltip-cal">
                                <div class="tooltip-content">
                                    <strong>${tooltip.title}</strong>
                                    <ul>
                                        ${tooltip.items.map(item => `<li>${item}</li>`).join('')}
                                    </ul>
                                </div>
                            </div>
                        </label>`;
            }
            
            html += `
                    </div>
                </div>`;
        });

        html += `
                        </div>
                        <div class="calibration-section">
                            <h4>Potential:</h4>`;

        questions.pot.forEach(q => {
            html += `
                <div class="calibration-question-item">
                    <label>${q.label}:</label>
                    <p class="question-description">${q.desc}</p>
                    <div class="rating-options-with-tooltips">`;
            
            for (let i = 1; i <= 4; i++) {
                const tooltip = tooltips[q.id][i];
                html += `
                        <label class="radio-label-cal has-tooltip-cal">
                            <input type="radio" name="case${caseId}_${q.id}" value="${i}" ${i === 1 ? 'required' : ''}>
                            <span class="radio-text">${i}</span>
                            <div class="custom-tooltip-cal">
                                <div class="tooltip-content">
                                    <strong>${tooltip.title}</strong>
                                    <ul>
                                        ${tooltip.items.map(item => `<li>${item}</li>`).join('')}
                                    </ul>
                                </div>
                            </div>
                        </label>`;
            }
            
            html += `
                    </div>
                </div>`;
        });

        html += `
                        </div>
                    </div>
                    <button type="submit" class="btn-primary">✅ Zapisz ocenę i zobacz porównanie</button>
                </form>
            </div>`;

        return html;
    }

    setupAssessmentFormListeners(caseId) {
        const form = document.getElementById(`calibration-form-${caseId}`);
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitAssessment(caseId, form);
        });
        
        // Setup tooltips for calibration form
        this.setupCalibrationTooltips();
    }

    setupCalibrationTooltips() {
        const tooltipLabels = document.querySelectorAll('.has-tooltip-cal');
        
        tooltipLabels.forEach(label => {
            const tooltip = label.querySelector('.custom-tooltip-cal');
            
            label.addEventListener('mouseenter', function(e) {
                const rect = label.getBoundingClientRect();
                const tooltipWidth = 280;
                
                // Position tooltip
                let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
                let top = rect.bottom + 12;
                
                // Adjust if going off right edge
                if (left + tooltipWidth > window.innerWidth - 10) {
                    left = window.innerWidth - tooltipWidth - 10;
                }
                
                // Adjust if going off left edge
                if (left < 10) {
                    left = 10;
                }
                
                tooltip.style.left = left + 'px';
                tooltip.style.top = top + 'px';
                tooltip.style.display = 'block';
            });
            
            label.addEventListener('mouseleave', function() {
                tooltip.style.display = 'none';
            });
        });
    }

    submitAssessment(caseId, form) {
        const formData = new FormData(form);
        const scores = {};
        
        for (let [key, value] of formData.entries()) {
            const questionId = key.replace(`case${caseId}_`, '');
            scores[questionId] = parseInt(value);
        }

        // Save assessment
        this.caseAssessments[`case${caseId}`] = scores;
        this.saveAssessments();

        // Show comparison
        this.showComparison(caseId, scores);
    }

    showComparison(caseId, userScores) {
        const benchmark = this.benchmarkScores[`case${caseId}`];
        const assessmentDiv = document.getElementById(`assessment-case${caseId}`);
        
        // Calculate categories
        const userPerfAvg = this.calculateAverage(userScores, 'perf');
        const userPotAvg = this.calculateAverage(userScores, 'pot');
        const benchPerfAvg = this.calculateAverage(benchmark, 'perf');
        const benchPotAvg = this.calculateAverage(benchmark, 'pot');
        
        // Scale to 1-5 for category calculation (like in main app)
        const userPerfScaled = this.scaleToFive(userPerfAvg);
        const userPotScaled = this.scaleToFive(userPotAvg);
        const benchPerfScaled = this.scaleToFive(benchPerfAvg);
        const benchPotScaled = this.scaleToFive(benchPotAvg);
        
        console.log('User scores:', { perf: userPerfScaled, pot: userPotScaled });
        console.log('Bench scores:', { perf: benchPerfScaled, pot: benchPotScaled });
        console.log('TalentDetector available:', !!this.talentDetector);
        
        // Create employee objects for categorization (needed for count method)
        const userEmployee = {
            performance: userPerfScaled,
            potential: userPotScaled,
            performanceDetails: {
                q1_dostarczanie_wynikow: userScores.perf_q1,
                q2_jakosc_pracy: userScores.perf_q2,
                q3_niezawodnosc: userScores.perf_q3,
                q4_radzenie_z_presja: userScores.perf_q4,
                q5_wspolpraca: userScores.perf_q5,
                q6_komunikacja: userScores.perf_q6
            },
            potentialDetails: {
                q7_uczenie_adaptacja: userScores.pot_q7,
                q8_ambicja_motywacja: userScores.pot_q8,
                q9_myslenie_strategiczne: userScores.pot_q9,
                q10_potencjal_przywodczy: userScores.pot_q10,
                q11_kompleksowosc: userScores.pot_q11,
                q12_samodzielnosc_inicjatywa: userScores.pot_q12
            }
        };
        
        const benchEmployee = {
            performance: benchPerfScaled,
            potential: benchPotScaled,
            performanceDetails: {
                q1_dostarczanie_wynikow: benchmark.perf_q1,
                q2_jakosc_pracy: benchmark.perf_q2,
                q3_niezawodnosc: benchmark.perf_q3,
                q4_radzenie_z_presja: benchmark.perf_q4,
                q5_wspolpraca: benchmark.perf_q5,
                q6_komunikacja: benchmark.perf_q6
            },
            potentialDetails: {
                q7_uczenie_adaptacja: benchmark.pot_q7,
                q8_ambicja_motywacja: benchmark.pot_q8,
                q9_myslenie_strategiczne: benchmark.pot_q9,
                q10_potencjal_przywodczy: benchmark.pot_q10,
                q11_kompleksowosc: benchmark.pot_q11,
                q12_samodzielnosc_inicjatywa: benchmark.pot_q12
            }
        };
        
        const userCategory = this.talentDetector ? this.talentDetector.getCategory(userEmployee) : { label: 'Błąd', description: 'Brak dostępu do systemu kategorii' };
        const benchCategory = this.talentDetector ? this.talentDetector.getCategory(benchEmployee) : { label: 'Błąd', description: 'Brak dostępu do systemu kategorii' };
        
        console.log('Categories:', { user: userCategory, bench: benchCategory });
        
        let html = `
            <div class="comparison-results">
                <h4>📊 Porównanie Twojej oceny z benchmarkiem eksperckim:</h4>
                
                <div class="category-comparison">
                    <div class="category-box user-category">
                        <h5>Twoja kategoria w 9-Box:</h5>
                        <div class="category-badge">${userCategory.label}</div>
                        <p class="category-desc">${userCategory.description}</p>
                    </div>
                    <div class="category-box benchmark-category">
                        <h5>Kategoria ekspercka:</h5>
                        <div class="category-badge">${benchCategory.label}</div>
                        <p class="category-desc">${benchCategory.description}</p>
                    </div>
                </div>
                
                <div class="comparison-summary">
                    <div class="score-comparison">
                        <div class="score-box">
                            <span class="score-label">Twoje Performance:</span>
                            <span class="score-value user">${userPerfAvg.toFixed(2)}</span>
                        </div>
                        <div class="score-box">
                            <span class="score-label">Benchmark Performance:</span>
                            <span class="score-value benchmark">${benchPerfAvg.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="score-comparison">
                        <div class="score-box">
                            <span class="score-label">Twoje Potential:</span>
                            <span class="score-value user">${userPotAvg.toFixed(2)}</span>
                        </div>
                        <div class="score-box">
                            <span class="score-label">Benchmark Potential:</span>
                            <span class="score-value benchmark">${benchPotAvg.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div class="detailed-comparison">
                    <h5>Szczegółowe porównanie pytań:</h5>
                    
                    <h6 style="margin-top: 20px; margin-bottom: 10px; color: #1a1a1a; font-weight: 700;">🎯 Performance (wyniki bieżące):</h6>
                    <table class="comparison-table">
                        <thead>
                            <tr>
                                <th>Pytanie</th>
                                <th>Twoja ocena</th>
                                <th>Benchmark</th>
                                <th>Różnica</th>
                            </tr>
                        </thead>
                        <tbody>`;

        const performanceLabels = {
            'perf_q1': '1. Dostarczanie wyników',
            'perf_q2': '2. Jakość i dokładność',
            'perf_q3': '3. Niezawodność',
            'perf_q4': '4. Presja',
            'perf_q5': '5. Współpraca',
            'perf_q6': '6. Komunikacja'
        };

        const potentialLabels = {
            'pot_q7': '7. Uczenie się',
            'pot_q8': '8. Ambicja',
            'pot_q9': '9. Myślenie strategiczne',
            'pot_q10': '10. Przywództwo',
            'pot_q11': '11. Kompleksowość',
            'pot_q12': '12. Samodzielność'
        };

        const questionLabels = {...performanceLabels, ...potentialLabels};

        // Calculate total deviation and accuracy score
        let totalDeviation = 0;
        let totalAbsoluteDeviation = 0;
        let exactMatches = 0;
        const totalQuestions = Object.keys(questionLabels).length;

        Object.keys(questionLabels).forEach(qId => {
            const userScore = userScores[qId];
            const benchScore = benchmark[qId];
            const diff = userScore - benchScore;
            totalDeviation += diff;
            totalAbsoluteDeviation += Math.abs(diff);
            if (diff === 0) exactMatches++;
        });

        // Calculate accuracy percentage
        // Method 1: Perfect match percentage
        const perfectMatchPercent = (exactMatches / totalQuestions * 100).toFixed(1);
        
        // Method 2: Distance-based accuracy (100% = perfect, decreases with deviation)
        // Max possible deviation = 3 points per question * 12 questions = 36
        const maxPossibleDeviation = 3 * totalQuestions;
        const accuracyScore = Math.max(0, (1 - totalAbsoluteDeviation / maxPossibleDeviation) * 100).toFixed(1);

        // Performance questions
        Object.keys(performanceLabels).forEach(qId => {
            const userScore = userScores[qId];
            const benchScore = benchmark[qId];
            const diff = userScore - benchScore;
            const diffClass = diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral';
            const diffText = diff > 0 ? `+${diff}` : diff;

            html += `
                <tr class="${diffClass}">
                    <td>${performanceLabels[qId]}</td>
                    <td>${userScore}</td>
                    <td>${benchScore}</td>
                    <td class="diff">${diffText}</td>
                </tr>`;
        });

        html += `
                        </tbody>
                    </table>
                    
                    <h6 style="margin-top: 30px; margin-bottom: 10px; color: #1a1a1a; font-weight: 700;">🚀 Potential (potencjał rozwojowy):</h6>
                    <table class="comparison-table">
                        <thead>
                            <tr>
                                <th>Pytanie</th>
                                <th>Twoja ocena</th>
                                <th>Benchmark</th>
                                <th>Różnica</th>
                            </tr>
                        </thead>
                        <tbody>`;

        // Potential questions
        Object.keys(potentialLabels).forEach(qId => {
            const userScore = userScores[qId];
            const benchScore = benchmark[qId];
            const diff = userScore - benchScore;
            const diffClass = diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral';
            const diffText = diff > 0 ? `+${diff}` : diff;

            html += `
                <tr class="${diffClass}">
                    <td>${potentialLabels[qId]}</td>
                    <td>${userScore}</td>
                    <td>${benchScore}</td>
                    <td class="diff">${diffText}</td>
                </tr>`;
        });

        html += `
                        </tbody>
                    </table>
                    
                    <div class="calibration-metrics">
                        <div class="metric-card">
                            <div class="metric-icon">📏</div>
                            <div class="metric-content">
                                <div class="metric-label">Suma odchyleń (bezwzględna)</div>
                                <div class="metric-value ${totalAbsoluteDeviation === 0 ? 'perfect' : totalAbsoluteDeviation < 6 ? 'good' : totalAbsoluteDeviation < 12 ? 'medium' : 'poor'}">
                                    ${totalAbsoluteDeviation.toFixed(1)}
                                </div>
                                <div class="metric-subtext">
                                    ${totalAbsoluteDeviation === 0 ? 'Perfekcyjnie! Zero odchyleń' : 
                                      totalAbsoluteDeviation < 6 ? '✅ Bardzo małe odchylenia' : 
                                      totalAbsoluteDeviation < 12 ? '⚠️ Umiarkowane odchylenia' :
                                      '❌ Duże odchylenia od benchmarku'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="metric-card">
                            <div class="metric-icon">📊</div>
                            <div class="metric-content">
                                <div class="metric-label">MAE (Mean Absolute Error)</div>
                                <div class="metric-value ${totalAbsoluteDeviation / totalQuestions < 0.5 ? 'good' : totalAbsoluteDeviation / totalQuestions < 1 ? 'medium' : 'poor'}">
                                    ${(totalAbsoluteDeviation / totalQuestions).toFixed(2)}
                                </div>
                                <div class="metric-subtext">
                                    Średnie odchylenie bezwzględne
                                    ${totalAbsoluteDeviation / totalQuestions < 0.5 ? '✅ Doskonała kalibracja!' : 
                                      totalAbsoluteDeviation / totalQuestions < 1 ? '⚠️ Dobra kalibracja' : 
                                      '❌ Wymaga poprawy'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="metric-card">
                            <div class="metric-icon">🎯</div>
                            <div class="metric-content">
                                <div class="metric-label">Accuracy Score</div>
                                <div class="metric-value ${accuracyScore >= 80 ? 'excellent' : accuracyScore >= 60 ? 'good' : accuracyScore >= 40 ? 'medium' : 'poor'}">
                                    ${accuracyScore}%
                                </div>
                                <div class="metric-subtext">
                                    Zgodność z benchmarkiem
                                    ${accuracyScore >= 80 ? '🌟 Ekspert!' : 
                                      accuracyScore >= 60 ? '✅ Bardzo dobrze' : 
                                      accuracyScore >= 40 ? '⚠️ Wystarczająco' : 
                                      '❌ Potrzeba więcej praktyki'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="metric-card">
                            <div class="metric-icon">✓</div>
                            <div class="metric-content">
                                <div class="metric-label">Dokładne trafienia</div>
                                <div class="metric-value">${exactMatches}/${totalQuestions}</div>
                                <div class="metric-subtext">
                                    ${perfectMatchPercent}% identycznych ocen
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="calibration-feedback">
                    ${this.generateFeedback(caseId, userScores, benchmark)}
                </div>

                <button class="btn-secondary" onclick="location.reload()">🔄 Oceń ponownie</button>
            </div>`;

        assessmentDiv.innerHTML = html;
        assessmentDiv.scrollIntoView({ behavior: 'smooth' });
    }

    calculateAverage(scores, type) {
        const prefix = type === 'perf' ? 'perf_q' : 'pot_q';
        const relevantScores = Object.keys(scores)
            .filter(key => key.startsWith(prefix))
            .map(key => scores[key]);
        
        return relevantScores.reduce((a, b) => a + b, 0) / relevantScores.length;
    }

    scaleToFive(score) {
        // Scale from 1-4 to 1-5 range (same as main application)
        return 1 + ((score - 1) * 4 / 3);
    }

    generateFeedback(caseId, userScores, benchmark) {
        const perfDiff = this.calculateAverage(userScores, 'perf') - this.calculateAverage(benchmark, 'perf');
        const potDiff = this.calculateAverage(userScores, 'pot') - this.calculateAverage(benchmark, 'pot');
        
        const feedback = {
            'case1': {
                name: 'Joanny',
                tips: [
                    'Joanna ma wysoką ambicję i motywację (Q8), ale strategia i głębia wiedzy wymagają rozwoju (Q9, Q11)',
                    'Świetnie radzi sobie z presją i adaptacją (Q4, Q7), ale brakuje konsekwencji w decyzjach (Q3)',
                    'Potencjał przywódczy jest widoczny (Q10), choć nie przetestowany jeszcze w praktyce'
                ]
            },
            'case2': {
                name: 'Roberta',
                tips: [
                    'Robert to przypadek "Enigma" (Q3) - wysoki potencjał (Q7, Q9, Q11) vs niska performance obecnie',
                    'Kluczowy problem: źle dopasowana rola. Wcześniej był świetny, teraz zdemotywowany (Q8, Q12)',
                    'Symptomy frustracji: wycofanie z zespołu (Q5), minimalna komunikacja (Q6), niespójna jakość (Q2)'
                ]
            },
            'case3': {
                name: 'Moniki',
                tips: [
                    'Monika to "Ekspert" (Q7) - doskonała performance (Q1-Q6), ale niski potencjał do większych ról',
                    'Świetna w swojej domenie technicznej, ale brak ambicji rozwojowych (Q8) i unikanie przywództwa (Q10)',
                    'Opór przed nowymi obszarami (Q7, Q11) i brakiem inicjatyw strategicznych (Q9, Q12)'
                ]
            },
            'case4': {
                name: 'Tomasza',
                tips: [
                    'Tomasz to "Niezawodny" (Q8) - doskonała performance przez 5 lat (Q1-Q3), średni potencjał',
                    'Kluczowe pytanie: widoczna ambicja (Q8) i potencjał przywódczy (Q10), ale brak potwierdzenia w praktyce',
                    'Ograniczenie: 5 lat w tej samej roli (Q11) - nie testował się jeszcze w odpowiedzialności za większe decyzje (Q10, Q12)'
                ]
            },
            'case5': {
                name: 'Katarzyny',
                tips: [
                    'Katarzyna to "Pracownik Zadaniowy" (Q4) - solidna performance (Q2-Q3), ale bardzo niski potencjał rozwojowy',
                    'Kluczowy wzór: wysoka niezawodność i jakość vs brak ambicji (Q8), opór przed zmianami (Q9), unikanie większej odpowiedzialności (Q10)',
                    'Wyzwanie: informacje ukryte w narracji - musisz sam/a zidentyfikować przykłady dla każdego pytania (np. reaktywność w problemie z raportowaniem → Q12)'
                ]
            }
        };

        const caseFeedback = feedback[`case${caseId}`];
        let html = '<div class="feedback-box">';
        html += `<h5>💡 Wskazówki dotyczące ${caseFeedback.name}:</h5><ul>`;
        caseFeedback.tips.forEach(tip => {
            html += `<li>${tip}</li>`;
        });
        html += '</ul>';

        if (Math.abs(perfDiff) > 0.5) {
            html += `<p class="warning">⚠️ Znaczna różnica w ocenie Performance (${perfDiff > 0 ? 'oceniasz za wysoko' : 'oceniasz za nisko'}). 
            Zwróć uwagę na konkretne przykłady w opisie.</p>`;
        }
        
        if (Math.abs(potDiff) > 0.5) {
            html += `<p class="warning">⚠️ Znaczna różnica w ocenie Potential (${potDiff > 0 ? 'oceniasz za wysoko' : 'oceniasz za nisko'}). 
            Potencjał to nie tylko wyniki, ale ambicja, uczenie się i zdolności strategiczne.</p>`;
        }

        html += '</div>';
        return html;
    }

    getBenchmarkScores() {
        return {
            'case1': { // Joanna - High Potential (Diamond: wysokie pot, średnie-wysokie perf)
                perf_q1: 4, // Świetne wyniki (108% celu)
                perf_q2: 3, // Jakość OK, ale błędy w szczegółach
                perf_q3: 2, // Brak konsekwencji w decyzjach
                perf_q4: 4, // Doskonale pod presją
                perf_q5: 3, // Współpraca OK, ale powierzchowna
                perf_q6: 3, // Komunikacja dobra, brak follow-up
                pot_q7: 4,  // Świetna adaptacja i uczenie
                pot_q8: 4,  // Wysoka ambicja
                pot_q9: 2,  // Brak myślenia strategicznego
                pot_q10: 3, // Potencjał przywódczy widoczny
                pot_q11: 2, // Szerokość bez głębi
                pot_q12: 4  // Bardzo proaktywna
            },
            'case2': { // Robert - Enigma (Q3: wysokie pot, niskie perf - źle dopasowany do roli)
                perf_q1: 2, // 65-75% celów w obecnej roli
                perf_q2: 2, // Niespójna jakość, brak zaangażowania
                perf_q3: 1, // Brak niezawodności ostatnio
                perf_q4: 2, // Tracił efektywność pod presją
                perf_q5: 2, // Wycofany z zespołu
                perf_q6: 2, // Komunikacja minimalna, brak uczestnictwa
                pot_q7: 3,  // Inteligentny, szybko się uczył wcześniej
                pot_q8: 3,  // Wcześniej ambitny, teraz zdemotywowany rolą
                pot_q9: 4,  // Ma zdolności strategiczne (pokazywał wcześniej)
                pot_q10: 3, // Był nieformalnym liderem w poprzednim zespole
                pot_q11: 4, // Szeroka perspektywa, doświadczenie międzyfunkcyjne
                pot_q12: 2  // Obecnie brak inicjatywy (frustracja rolą)
            },
            'case3': { // Monika - Ekspert (Q7: niskie pot, wysokie perf - ekspert bez ambicji)
                perf_q1: 4, // 110-115% celów konsekwentnie
                perf_q2: 4, // Wyjątkowa jakość w swojej domenie
                perf_q3: 4, // Absolutna niezawodność
                perf_q4: 4, // Świetnie pod presją w swoim obszarze
                perf_q5: 3, // Współpraca dobra, mentoring techniczny
                perf_q6: 4, // Doskonała komunikacja techniczna
                pot_q7: 2,  // Opór przed nowymi technologiami spoza specjalizacji
                pot_q8: 1,  // Brak zainteresowania awansem czy nowymi rolami
                pot_q9: 1,  // Utrzymuje status quo, nie proponuje innowacji
                pot_q10: 1, // Unika ról przywódczych
                pot_q11: 2, // Głęboka ekspertyza, ale wąski zakres
                pot_q12: 2  // Samodzielna w scope, ale nie wykracza poza niego
            },
            'case4': { // Tomasz - Niezawodny (Q8: średnie pot, wysokie perf - solidny performer z ambicją)
                perf_q1: 4, // Konsekwentnie przekracza oczekiwania 105-110%
                perf_q2: 4, // Wysoka jakość analiz, 5 lat doświadczenia
                perf_q3: 4, // Bardzo niezawodny przez 5 lat
                perf_q4: 3, // Radzi sobie z presją, utrzymuje work-life balance
                perf_q5: 4, // Skutecznie łączy zespoły międzydziałowe
                perf_q6: 4, // Doskonałe relacje z klientami i komunikacja
                pot_q7: 3,  // Pogłębia wiedzę w swoim obszarze
                pot_q8: 3,  // Silne pragnienie rozwoju, ambicja do większych ról
                pot_q9: 3,  // Sprawnie w strategicznych tematach, szuka nowych podejść
                pot_q10: 2, // Widoczny potencjał, ale brak formalnego doświadczenia przywódczego
                pot_q11: 3, // Doświadczenie międzydziałowe, rozumienie biznesu
                pot_q12: 3  // Wykazuje inicjatywę w ramach roli
            },
            'case5': { // Katarzyna - Pracownik Zadaniowy (Q4: niskie pot, średnie perf - solidna ale bez ambicji)
                perf_q1: 3, // 95-100% celów, stabilnie ale nie przekracza
                perf_q2: 3, // Dobra jakość dokumentacji, ale brak wyróżnienia
                perf_q3: 3, // Niezawodna w ramach procedur
                perf_q4: 3, // Zachowuje spokój pod presją, ale trzyma się procedur
                perf_q5: 3, // Uprzejma, pomocna, ale nie inicjuje współpracy
                perf_q6: 2, // Słabsza komunikacja ustna w większych grupach
                pot_q7: 2,  // Uczy się tylko w zakresie niezbędnym, brak ciekawości
                pot_q8: 1,  // Zadowolona z obecnej roli, nie chce większej odpowiedzialności
                pot_q9: 1,  // Opiera się zmianom, "po co zmieniać jak działa"
                pot_q10: 1, // Woli koordynować niż zarządzać, unika decyzji biznesowych
                pot_q11: 2, // Głęboka wiedza w wąskim zakresie, problemy z niestandardowymi projektami
                pot_q12: 2  // Reaktywna, eskaluje zamiast rozwiązywać samodzielnie
            }
        };
    }

    loadAssessments() {
        const saved = localStorage.getItem('calibrationAssessments');
        return saved ? JSON.parse(saved) : {};
    }

    saveAssessments() {
        localStorage.setItem('calibrationAssessments', JSON.stringify(this.caseAssessments));
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Starting CalibrationModule');
    
    // Create simple talent detector instance
    const talentDetector = new SimpleTalentDetector();
    
    // Initialize calibration module
    const calibration = new CalibrationModule(talentDetector);
    
    console.log('CalibrationModule initialized successfully');
});
