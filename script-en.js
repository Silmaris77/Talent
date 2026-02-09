// Talent Detector - Calibration - Simplified version

// Simple implementation of getCategory for CalibrationModule
class SimpleTalentDetector {
    getCategory(employee) {
        // Convert average scores to levels using thresholds with detailed rules
        const perfRatings = employee.performanceDetails ? Object.values(employee.performanceDetails) : [];
        const potRatings = employee.potentialDetails ? Object.values(employee.potentialDetails) : [];
        
        const perfLevel = this.scaleToLevel(employee.performance, perfRatings, 'performance');
        const potLevel = this.scaleToLevel(employee.potential, potRatings, 'potential');

        const categories = {
            '3-3': { label: 'Q9 Star', description: 'High performance + high potential - most valuable organizational talents' },
            '3-2': { label: 'Q8 High Performer', description: 'High performance + medium potential - experts in their role' },
            '3-1': { label: 'Q7 Expert', description: 'High performance + low potential - solid performers without promotion ambition' },
            '2-3': { label: 'Q6 Future star', description: 'Medium performance + high potential - talents requiring development' },
            '2-2': { label: 'Q5 Key employee', description: 'Medium performance + medium potential - stable organizational core' },
            '2-1': { label: 'Q4 Reliable performer', description: 'Medium performance + low potential - performers of routine tasks' },
            '1-3': { label: 'Q3 Enigma', description: 'Low performance + high potential - untapped potential or poorly matched role' },
            '1-2': { label: 'Q2 Inconsistent', description: 'Low performance + medium potential - require support and structure' },
            '1-1': { label: 'Q1 Poor performer', description: 'Low performance + low potential - requires Performance Improvement Plan' }
        };

        return categories[`${perfLevel}-${potLevel}`] || { label: 'Undefined', description: 'Insufficient data' };
    }

    scaleToLevel(avgValue, ratings = [], dimension = 'performance') {
        // Advanced categorization rules (direct 1-4 scale)
        // PERFORMANCE - HIGH: Average >3.3 AND no rating "1"
        // POTENTIAL - HIGH: Average >=3.5 AND no rating "1"
        // PERFORMANCE - LOW: Average <2.5 AND >=3 ratings <3
        // POTENTIAL - LOW: Average <=2.5
        // MEDIUM: all other cases
        
        if (ratings.length > 0) {
            const hasRatingOne = ratings.some(r => r === 1);
            const lowRatingsCount = ratings.filter(r => r < 3).length;
            
            console.log(`🔍 Advanced categorization [${dimension}]: avgValue=${avgValue.toFixed(2)}, ratings=[${ratings}], hasRatingOne=${hasRatingOne}, lowRatingsCount=${lowRatingsCount}`);
            
            if (dimension === 'potential') {
                // POTENTIAL - High: Average >=3.5 AND no rating "1"
                if (avgValue >= 3.5 && !hasRatingOne) {
                    console.log(`✅ HIGH potential (avgValue=${avgValue.toFixed(2)} >= 3.5, no rating "1")`);
                    return 3;
                }
                
                // POTENTIAL - Low: Average <=2.5
                if (avgValue <= 2.5) {
                    console.log(`⬇️ LOW potential (avgValue=${avgValue.toFixed(2)} <= 2.5)`);
                    return 1;
                }
                
                // POTENTIAL - Medium: everything else
                console.log(`🔶 MEDIUM potential (HIGH and LOW conditions not met)`);
                return 2;
            } else {
                // PERFORMANCE - High: Average >3.3 AND no rating "1"
                if (avgValue > 3.3 && !hasRatingOne) {
                    console.log(`✅ HIGH performance (avgValue=${avgValue.toFixed(2)} > 3.3, no rating "1")`);
                    return 3;
                }
                
                // PERFORMANCE - Low: Average <2.5 AND >=3 ratings <3
                if (avgValue < 2.5 && lowRatingsCount >= 3) {
                    console.log(`⬇️ LOW performance (avgValue=${avgValue.toFixed(2)} < 2.5, ${lowRatingsCount} ratings <3)`);
                    return 1;
                }
                
                // PERFORMANCE - Medium: everything else
                console.log(`🔶 MEDIUM performance (HIGH and LOW conditions not met)`);
                return 2;
            }
        }
        
        // Fallback: simple logic when detailed ratings are not available
        console.log(`⚠️ Fallback [${dimension}] - no detailed ratings, avgValue=${avgValue.toFixed(2)}`);
        if (dimension === 'potential') {
            if (avgValue <= 2.5) return 1;
            if (avgValue < 3.5) return 2;
            return 3;
        } else {
            if (avgValue < 2.5) return 1;
            if (avgValue <= 3.3) return 2;
            return 3;
        }
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
                1: { title: 'Below expectations - examples:', items: ['goals are achieved rarely or to a limited extent,', 'significant difficulties arise with delivering results even in favorable conditions,', 'frequent support or intervention required to achieve basic results.'] },
                2: { title: 'Partially meets expectations - examples:', items: ['achieves goals irregularly or with delays,', 'delivers results in favorable conditions, but has difficulty in more demanding situations,', 'needs support with prioritization or task execution to achieve expected results.'] },
                3: { title: 'Meets expectations - examples:', items: ['achieves agreed goals according to plan and priorities,', 'delivers results under typical working conditions for the role,', 'takes responsibility for own scope of tasks and completes them on time.'] },
                4: { title: 'Exceeds expectations - examples:', items: ['regularly achieves or exceeds goals in situations more difficult than standard (e.g., limited resources, time pressure),', 'delivers key results even when conditions change or goals are ambiguous,', 'takes responsibility for team or area outcomes, not just own scope of tasks.'] }
            },
            perf_q2: {
                1: { title: 'Below expectations - examples:', items: ['work quality often does not meet established standards,', 'errors appear regularly and require corrections from others,', 'procedures or best practices are not applied consistently.'] },
                2: { title: 'Partially meets expectations - examples:', items: ['work quality is uneven and requires corrections more often than the role standard assumes,', 'makes errors that are corrected only after attention is drawn,', 'does not always consistently apply established procedures or best practices.'] },
                3: { title: 'Meets expectations - examples:', items: ['delivers work in accordance with requirements and quality standards,', 'makes occasional errors that are quickly corrected,', 'applies established procedures and best practices.'] },
                4: { title: 'Exceeds expectations - examples:', items: ['delivers high quality work without need for corrections, also with complex or new tasks,', 'identifies quality risks themselves and prevents errors before they appear,', 'raises quality standards in the team (e.g., proposes improvements, checklists, best practices).'] }
            },
            perf_q3: {
                1: { title: 'Below expectations - examples:', items: ['commitments are not fulfilled on time or in full scope,', 'level of task completion is difficult to predict,', 'constant monitoring or reminders necessary for tasks to be completed.'] },
                2: { title: 'Partially meets expectations - examples:', items: ['fulfills commitments, but not always on time or in full scope,', 'requires reminders or monitoring to close tasks,', 'level of task completion varies over time.'] },
                3: { title: 'Meets expectations - examples:', items: ['is timely and fulfills commitments,', 'can be relied upon in daily work,', 'maintains predictable level of task completion.'] },
                4: { title: 'Exceeds expectations - examples:', items: ['can be relied upon in critical moments or high-stakes projects,', 'independently organizes work and support, without need for constant monitoring,', 'maintains stable delivery level even with high workload or uncertainty.'] }
            },
            perf_q4: {
                1: { title: 'Below expectations - examples:', items: ['pressure or change clearly decrease effectiveness of action,', 'adaptation to new conditions is difficult even with clear guidelines,', 'tension affects work quality or cooperation with others.'] },
                2: { title: 'Partially meets expectations - examples:', items: ['handles pressure in simple, predictable situations,', 'needs time or additional support to adapt to changes,', 'in tension situations temporarily loses effectiveness or confidence in action.'] },
                3: { title: 'Meets expectations - examples:', items: ['maintains effectiveness in standard pressure situations,', 'adapts to changes after receiving clear guidelines,', 'does not transfer tension to others and maintains professionalism.'] },
                4: { title: 'Exceeds expectations - examples:', items: ['maintains effectiveness and calm in situations of high pressure or chaos,', 'quickly adapts to changes and helps others find their way in new situation,', 'can make good decisions despite incomplete information.'] }
            },
            perf_q5: {
                1: { title: 'Below expectations - examples:', items: ['cooperation with others is limited or hindered,', 'information is not passed on sufficiently to complete tasks,', 'working relationships require support or moderation.'] },
                2: { title: 'Partially meets expectations - examples:', items: ['cooperates correctly, but mainly within their immediate scope,', 'shares information when asked,', 'rarely initiates cooperation or support for others.'] },
                3: { title: 'Meets expectations - examples:', items: ['cooperates in an open and professional manner,', 'shares information needed to complete tasks,', 'respects roles and team arrangements.'] },
                4: { title: 'Exceeds expectations - examples:', items: ['really impacts the quality of cooperation in team or between teams,', 'shares knowledge and experience in a way that accelerates work of others,', 'is a natural "reference point" or partner for solving difficult topics.'] }
            },
            perf_q6: {
                1: { title: 'Below expectations - examples:', items: ['communication is limited, unclear or inconsistent,', 'information is passed on selectively, with delay or after the fact,', 'communication style hinders cooperation or leads to misunderstandings,', 'reaction to feedback is defensive or minimal.'] },
                2: { title: 'Partially meets expectations - examples:', items: ['communicates correctly in simple, routine situations,', 'passes on information when asked, but rarely initiates communication,', 'openness and cooperation are uneven and depend on context or relationship,', 'accepts feedback, but does not always translate it into behavior change.'] },
                3: { title: 'Meets expectations - examples:', items: ['communicates clearly, openly and with respect,', 'regularly exchanges information necessary for task completion,', 'cooperates constructively with others,', 'accepts feedback and responds to it professionally.'] },
                4: { title: 'Exceeds expectations - examples:', items: ['actively cares for communication quality in team or between teams,', 'clearly formulates expectations, listens and adapts communication style to interlocutor,', 'initiates open exchange of information and feedback,', 'prevents misunderstandings and supports others in effective cooperation.'] }
            },
            pot_q7: {
                1: { title: 'Below expectations - examples:', items: ['acquisition of new skills is significantly slower than role standard assumes,', 'difficulties appear in translating knowledge into practice,', 'feedback does not lead to noticeable change in way of acting.'] },
                2: { title: 'Partially meets expectations - examples:', items: ['learns new skills slower than role standard assumes,', 'needs additional time or support to translate knowledge into practice,', 'responds to feedback, but does not always implement it consistently.'] },
                3: { title: 'Meets expectations - examples:', items: ['acquires new skills at pace appropriate for the role,', 'applies acquired knowledge in practice after implementation period,', 'responds constructively to feedback.'] },
                4: { title: 'Exceeds expectations - examples:', items: ['very quickly acquires new skills and effectively applies them in practice,', 'actively seeks new areas of development themselves without formal impulse,', 'learns from mistakes and clearly changes way of acting for the future.'] }
            },
            pot_q8: {
                1: { title: 'Below expectations - examples:', items: ['interest in development is limited or short-lived,', 'development goals are not realized even with support,', 'willingness to take on new challenges rarely appears.'] },
                2: { title: 'Partially meets expectations - examples:', items: ['declares willingness to develop, but development actions are irregular,', 'realizes development goals mainly after external impulse,', 'rarely independently reports readiness to take on new challenges.'] },
                3: { title: 'Meets expectations - examples:', items: ['shows interest in development within current role,', 'realizes agreed development goals,', 'is open to new tasks when they appear.'] },
                4: { title: 'Exceeds expectations - examples:', items: ['clearly communicates desire for development and takes responsibility for own path,', 'takes on more difficult tasks or challenges beyond current role,', 'consistently invests time and energy in competence development.'] }
            },
            pot_q9: {
                1: { title: 'Below expectations - examples:', items: ['focus remains almost exclusively on current tasks,', 'seeing broader context of actions is difficult,', 'initiative in area of improvements or new solutions practically does not appear.'] },
                2: { title: 'Partially meets expectations - examples:', items: ['focuses mainly on current tasks,', 'sees broader context only after it is pointed out,', 'rarely proposes improvements or new solutions on own initiative.'] },
                3: { title: 'Meets expectations - examples:', items: ['understands context of own actions and their impact on team goals,', 'proposes improvements in own area of responsibility,', 'acts in accordance with adopted directions and priorities.'] },
                4: { title: 'Exceeds expectations - examples:', items: ['sees dependencies and consequences of actions in broader business context,', 'proposes solutions that really improve processes or way of working,', 'is not limited to "how it is", but actively seeks "how it can be better".'] }
            },
            pot_q10: {
                1: { title: 'Below expectations - examples:', items: ['avoids responsibility beyond basic scope of tasks,', 'communication does not support building engagement or clarity of actions,', 'does not show readiness to take on roles requiring greater influence.'] },
                2: { title: 'Partially meets expectations - examples:', items: ['can take responsibility for task after clear indication,', 'communicates correctly, but has difficulty exerting influence,', 'reluctant to go beyond formally assigned scope of role.'] },
                3: { title: 'Meets expectations - examples:', items: ['can take responsibility for task or part of team work,', 'communicates clearly and constructively,', 'is ready to develop toward greater influence if such need arises.'] },
                4: { title: 'Exceeds expectations - examples:', items: ['naturally takes responsibility for others, even without formal leader role,', 'can motivate, organize work or integrate people around goal,', 'is perceived by others as authority or person whom "one wants to follow".'] }
            },
            pot_q11: {
                1: { title: 'Below expectations - examples:', items: ['even moderate complexity of tasks causes difficulties in action,', 'problems are solved fragmentarily or chaotically,', 'intensive support often needed when making decisions.'] },
                2: { title: 'Partially meets expectations - examples:', items: ['handles simple or well-defined problems,', 'has difficulty organizing many threads simultaneously,', 'often needs support with atypical or ambiguous tasks.'] },
                3: { title: 'Meets expectations - examples:', items: ['handles typical complexity of tasks within role,', 'organizes information and makes logical decisions,', 'uses support or consultations in atypical situations.'] },
                4: { title: 'Exceeds expectations - examples:', items: ['effectively handles multi-threaded, ambiguous problems,', 'combines different perspectives (business, operational, human) into coherent solutions,', 'gradually takes responsibility for increasingly complex tasks or decisions.'] }
            },
            pot_q12: {
                1: { title: 'Below expectations - examples:', items: ['acts mainly reactively and expects detailed instructions,', 'rarely takes initiative or responsibility for way of task realization,', 'has difficulty solving problems independently,', 'does not show interest in improving own work or team work.'] },
                2: { title: 'Partially meets expectations - examples:', items: ['takes initiative in simple or well-known areas,', 'can act independently after receiving clear framework or guidance,', 'reports improvement ideas sporadically or after encouragement,', 'in new or ambiguous situations hesitates before taking action.'] },
                3: { title: 'Meets expectations - examples:', items: ['independently organizes own work and realizes tasks within role,', 'takes initiative in areas for which responsible,', 'actively seeks ways to improve own work,', 'responds to problems without need for constant supervision.'] },
                4: { title: 'Exceeds expectations - examples:', items: ['consistently takes responsibility for effects, not just for tasks,', 'initiates actions beyond current scope of role,', 'proposes and implements improvements with real impact on team or area,', 'encourages others to act and builds sense of agency around themselves.'] }
            }
        };

        const questions = {
            perf: [
                { id: 'perf_q1', label: '1. Results delivery', desc: 'Employee achieves results aligned with role goals and expectations' },
                { id: 'perf_q2', label: '2. Work quality and accuracy', desc: 'Quality of work and task execution accuracy are at high level' },
                { id: 'perf_q3', label: '3. Reliability and consistency', desc: 'Employee works independently or finds appropriate support independently' },
                { id: 'perf_q4', label: '4. Handling pressure and change', desc: 'Effectively handles pressure, change and ambiguity situations' },
                { id: 'perf_q5', label: '5. Collaboration and impact on others', desc: 'Brings positive impact to team - supports, shares knowledge, inspires others' },
                { id: 'perf_q6', label: '6. Communication', desc: 'Employee willingly collaborates with others, shows respect, communicates openly and actively exchanges feedback' }
            ],
            pot: [
                { id: 'pot_q7', label: '7. Learning ability and adaptation', desc: 'Quickly acquires new skills and adapts to changes' },
                { id: 'pot_q8', label: '8. Ambition and development motivation', desc: 'Shows desire for development and taking on new challenges' },
                { id: 'pot_q9', label: '9. Strategic thinking and innovation', desc: 'Understands broader business context and proposes new solutions' },
                { id: 'pot_q10', label: '10. Leadership potential and influence', desc: 'Can take responsibility and exert positive influence on others' },
                { id: 'pot_q11', label: '11. Complexity', desc: 'Handles complex, multi-threaded problems' },
                { id: 'pot_q12', label: '12. Independence and initiative', desc: 'Acts proactively and takes responsibility for results' }
            ]
        };

        let html = `
            <div class="calibration-form">
                <h4>📝 Rate the case study using scale 1-4:</h4>
                <p class="help-text">Hover over numbers to see detailed description of each rating level</p>
                
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
                    <button type="submit" class="btn-primary">✅ Submit assessment</button>
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
        
        // Calculate averages directly in 1-4 scale
        const userPerfAvg = this.calculateAverage(userScores, 'perf');
        const userPotAvg = this.calculateAverage(userScores, 'pot');
        const benchPerfAvg = this.calculateAverage(benchmark, 'perf');
        const benchPotAvg = this.calculateAverage(benchmark, 'pot');
        
        console.log('User scores:', { perf: userPerfAvg, pot: userPotAvg });
        console.log('Bench scores:', { perf: benchPerfAvg, pot: benchPotAvg });
        console.log('TalentDetector available:', !!this.talentDetector);
        
        // Create employee objects for categorization (needed for count method)
        const userEmployee = {
            performance: userPerfAvg,
            potential: userPotAvg,
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
            performance: benchPerfAvg,
            potential: benchPotAvg,
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
        
        const userCategory = this.talentDetector ? this.talentDetector.getCategory(userEmployee) : { label: 'Error', description: 'No access to category system' };
        const benchCategory = this.talentDetector ? this.talentDetector.getCategory(benchEmployee) : { label: 'Error', description: 'No access to category system' };
        
        console.log('Categories:', { user: userCategory, bench: benchCategory });
        
        let html = `
            <div class="comparison-results">
                <h4>📊 Comparison of your assessment with expert benchmark:</h4>
                
                <div class="category-comparison">
                    <div class="category-box user-category">
                        <h5>Your category in 9-Box:</h5>
                        <div class="category-badge">${userCategory.label}</div>
                        <p class="category-desc">${userCategory.description}</p>
                    </div>
                    <div class="category-box benchmark-category">
                        <h5>Expert category:</h5>
                        <div class="category-badge">${benchCategory.label}</div>
                        <p class="category-desc">${benchCategory.description}</p>
                    </div>
                </div>
                
                <div class="comparison-summary">
                    <div class="score-comparison">
                        <div class="score-box">
                            <span class="score-label">Your Performance:</span>
                            <span class="score-value user">${userPerfAvg.toFixed(2)}</span>
                        </div>
                        <div class="score-box">
                            <span class="score-label">Benchmark Performance:</span>
                            <span class="score-value benchmark">${benchPerfAvg.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="score-comparison">
                        <div class="score-box">
                            <span class="score-label">Your Potential:</span>
                            <span class="score-value user">${userPotAvg.toFixed(2)}</span>
                        </div>
                        <div class="score-box">
                            <span class="score-label">Benchmark Potential:</span>
                            <span class="score-value benchmark">${benchPotAvg.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div class="detailed-comparison">
                    <h5>Detailed question comparison:</h5>
                    
                    <h6 style="margin-top: 20px; margin-bottom: 10px; color: #1a1a1a; font-weight: 700;">🎯 Performance (current results):</h6>
                    <table class="comparison-table">
                        <thead>
                            <tr>
                                <th>Question</th>
                                <th>Your rating</th>
                                <th>Benchmark</th>
                                <th>Difference</th>
                            </tr>
                        </thead>
                        <tbody>`;

        const performanceLabels = {
            'perf_q1': '1. Results delivery',
            'perf_q2': '2. Quality and accuracy',
            'perf_q3': '3. Reliability',
            'perf_q4': '4. Pressure',
            'perf_q5': '5. Collaboration',
            'perf_q6': '6. Communication'
        };

        const potentialLabels = {
            'pot_q7': '7. Learning',
            'pot_q8': '8. Ambition',
            'pot_q9': '9. Strategic thinking',
            'pot_q10': '10. Leadership',
            'pot_q11': '11. Complexity',
            'pot_q12': '12. Independence'
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
                    
                    <h6 style="margin-top: 30px; margin-bottom: 10px; color: #1a1a1a; font-weight: 700;">🚀 Potential (development potential):</h6>
                    <table class="comparison-table">
                        <thead>
                            <tr>
                                <th>Question</th>
                                <th>Your rating</th>
                                <th>Benchmark</th>
                                <th>Difference</th>
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
                                <div class="metric-label">Total deviation (absolute)</div>
                                <div class="metric-value ${totalAbsoluteDeviation === 0 ? 'perfect' : totalAbsoluteDeviation < 6 ? 'good' : totalAbsoluteDeviation < 12 ? 'medium' : 'poor'}">
                                    ${totalAbsoluteDeviation.toFixed(1)}
                                </div>
                                <div class="metric-subtext">
                                    ${totalAbsoluteDeviation === 0 ? 'Perfect! Zero deviations' : 
                                      totalAbsoluteDeviation < 6 ? '✅ Very small deviations' : 
                                      totalAbsoluteDeviation < 12 ? '⚠️ Moderate deviations' :
                                      '❌ Large deviations from benchmark'}
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
                                    Average absolute deviation
                                    ${totalAbsoluteDeviation / totalQuestions < 0.5 ? '✅ Excellent calibration!' : 
                                      totalAbsoluteDeviation / totalQuestions < 1 ? '⚠️ Good calibration' : 
                                      '❌ Needs improvement'}
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
                                    Alignment with benchmark
                                    ${accuracyScore >= 80 ? '🌟 Expert!' : 
                                      accuracyScore >= 60 ? '✅ Very good' : 
                                      accuracyScore >= 40 ? '⚠️ Sufficient' : 
                                      '❌ More practice needed'}
                                </div>
                            </div>
                        </div>
                        
                        <div class="metric-card">
                            <div class="metric-icon">✓</div>
                            <div class="metric-content">
                                <div class="metric-label">Exact matches</div>
                                <div class="metric-value">${exactMatches}/${totalQuestions}</div>
                                <div class="metric-subtext">
                                    ${perfectMatchPercent}% identical ratings
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="calibration-feedback">
                    ${this.generateFeedback(caseId, userScores, benchmark)}
                </div>

                <button class="btn-secondary" onclick="location.reload()">🔄 Rate again</button>
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



    generateFeedback(caseId, userScores, benchmark) {
        const perfDiff = this.calculateAverage(userScores, 'perf') - this.calculateAverage(benchmark, 'perf');
        const potDiff = this.calculateAverage(userScores, 'pot') - this.calculateAverage(benchmark, 'pot');
        
        const feedback = {
            'case1': {
                name: 'Joanna',
                tips: [
                    'Joanna is a "Key employee" (Q5) - medium performance and medium potential, solid organizational core',
                    'Results are good (108% of target), but lacks consistency (#3) and depth in decisions (#11)',
                    'High ambition and energy (#8, #12), but potential limited by lack of strategic thinking (#9) and depth of knowledge (#11)'
                ]
            },
            'case2': {
                name: 'Robert',
                tips: [
                    'Robert is "Inconsistent" (Q2) - low performance (1.83) with medium potential (3.17)',
                    'Key problem: poorly matched role. Was excellent before (120%+ targets), now only 65-75%',
                    'Symptoms of frustration: withdrawal from team (#5), minimal communication (#6), lack of reliability (#3)',
                    '⚠️ Significant gap between potential (strategic abilities #9, broad perspective #11) and current results - requires support and structure'
                ]
            },
            'case3': {
                name: 'Monika',
                tips: [
                    'Monika is an "Expert" (Q7) - high performance (3.83), low potential (1.50)',
                    'Excellent in her domain: 110-115% targets, exceptional quality (#1, #2), absolute reliability (#3)',
                    'Very low development potential: no interest in promotion (#8=1), avoids leadership (#10=1), resistance to change (#9=1)',
                    '✅ Valuable technical expert - keep in specialist role, don\'t force managerial path'
                ]
            },
            'case4': {
                name: 'Tomasz',
                tips: [
                    'Tomasz is a "High Performer" (Q8) - high performance (3.83), medium potential (2.83)',
                    'Consistently exceeds expectations: 105-110% targets, high quality, very reliable for 5 years (#1-#3)',
                    'Medium potential: visible ambition (#8=3) and initiative (#12=3), but lacks formal leadership experience (#10=2)',
                    '✅ Solid candidate for development into more complex analytical roles, but leadership requires practical verification'
                ]
            },
            'case5': {
                name: 'Katarzyna',
                tips: [
                    'Katarzyna is a "Reliable performer" (Q4) - medium performance (2.83), low potential (1.50)',
                    'Stable performance: 95-100% targets, good quality, reliable within procedures (#1-#3)',
                    'Very low potential: satisfied with current role (#8=1), resistance to changes (#9=1), avoids business decisions (#10=1)',
                    '⚠️ Key signals: reactivity instead of proactivity, passing problems upward instead of solving them (#12=2)'
                ]
            }
        };

        const caseFeedback = feedback[`case${caseId}`];
        let html = '<div class="feedback-box">';
        html += `<h5>💡 Tips regarding ${caseFeedback.name}:</h5><ul>`;
        caseFeedback.tips.forEach(tip => {
            html += `<li>${tip}</li>`;
        });
        html += '</ul>';

        if (Math.abs(perfDiff) > 0.5) {
            html += `<p class="warning">⚠️ Significant difference in Performance assessment (${perfDiff > 0 ? 'you rate too high' : 'you rate too low'}). 
            Pay attention to specific examples in the description.</p>`;
        }
        
        if (Math.abs(potDiff) > 0.5) {
            html += `<p class="warning">⚠️ Significant difference in Potential assessment (${potDiff > 0 ? 'you rate too high' : 'you rate too low'}). 
            Potential is not just results, but ambition, learning and strategic abilities.</p>`;
        }

        html += '</div>';
        return html;
    }

    getBenchmarkScores() {
        return {
            'case1': { // Joanna - High Potential (Diamond: high pot, medium-high perf)
                perf_q1: 4, // Excellent results (108% of target)
                perf_q2: 3, // Quality OK, but errors in details
                perf_q3: 2, // Lack of consistency in decisions
                perf_q4: 4, // Excellent under pressure
                perf_q5: 3, // Cooperation OK, but superficial
                perf_q6: 3, // Communication good, no follow-up
                pot_q7: 4,  // Great adaptation and learning
                pot_q8: 4,  // High ambition
                pot_q9: 2,  // Lack of strategic thinking
                pot_q10: 3, // Leadership potential visible
                pot_q11: 2, // Breadth without depth
                pot_q12: 4  // Very proactive
            },
            'case2': { // Robert - Enigma (Q3: high pot, low perf - poorly matched role)
                perf_q1: 2, // 65-75% of targets in current role
                perf_q2: 2, // Inconsistent quality, lack of engagement
                perf_q3: 1, // Lack of reliability lately
                perf_q4: 2, // Lost effectiveness under pressure
                perf_q5: 2, // Withdrawn from team
                perf_q6: 2, // Minimal communication, no participation
                pot_q7: 3,  // Intelligent, learned quickly before
                pot_q8: 3,  // Previously ambitious, now demotivated by role
                pot_q9: 4,  // Has strategic abilities (showed before)
                pot_q10: 3, // Was informal leader in previous team
                pot_q11: 4, // Broad perspective, cross-functional experience
                pot_q12: 2  // Currently no initiative (role frustration)
            },
            'case3': { // Monika - Expert (Q7: low pot, high perf - expert without ambition)
                perf_q1: 4, // 110-115% of targets consistently
                perf_q2: 4, // Exceptional quality in her domain
                perf_q3: 4, // Absolute reliability
                perf_q4: 4, // Great under pressure in her area
                perf_q5: 3, // Good cooperation, technical mentoring
                perf_q6: 4, // Excellent technical communication
                pot_q7: 2,  // Resistance to new technologies outside specialization
                pot_q8: 1,  // No interest in promotion or new roles
                pot_q9: 1,  // Maintains status quo, does not propose innovations
                pot_q10: 1, // Avoids leadership roles
                pot_q11: 2, // Deep expertise, but narrow scope
                pot_q12: 2  // Independent in scope, but does not go beyond it
            },
            'case4': { // Tomasz - Reliable (Q8: medium pot, high perf - solid performer with ambition)
                perf_q1: 4, // Consistently exceeds expectations 105-110%
                perf_q2: 4, // High quality analysis, 5 years experience
                perf_q3: 4, // Very reliable for 5 years
                perf_q4: 3, // Handles pressure, maintains work-life balance
                perf_q5: 4, // Effectively connects cross-departmental teams
                perf_q6: 4, // Excellent client relations and communication
                pot_q7: 3,  // Deepens knowledge in his area
                pot_q8: 3,  // Strong desire for development, ambition for bigger roles
                pot_q9: 3,  // Proficient in strategic topics, seeks new approaches
                pot_q10: 2, // Visible potential, but no formal leadership experience
                pot_q11: 3, // Cross-departmental experience, business understanding
                pot_q12: 3  // Shows initiative within role
            },
            'case5': { // Katarzyna - Task Worker (Q4: low pot, medium perf - solid but without ambition)
                perf_q1: 3, // 95-100% of targets, stable but does not exceed
                perf_q2: 3, // Good documentation quality, but no distinction
                perf_q3: 3, // Reliable within procedures
                perf_q4: 3, // Keeps calm under pressure, but sticks to procedures
                perf_q5: 3, // Polite, helpful, but does not initiate cooperation
                perf_q6: 2, // Weaker oral communication in larger groups
                pot_q7: 2,  // Learns only what is necessary, no curiosity
                pot_q8: 1,  // Satisfied with current role, does not want more responsibility
                pot_q9: 1,  // Resists changes, "why change if it works"
                pot_q10: 1, // Prefers to coordinate rather than manage, avoids business decisions
                pot_q11: 2, // Deep knowledge in narrow scope, problems with non-standard projects
                pot_q12: 2  // Reactive, escalates instead of solving independently
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
