import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Star, Volume2, Phone, RefreshCw, AlertCircle, CheckCircle2, Home } from 'lucide-react';
import { supabase, type LearningContent } from '@/lib/supabase';
import { getDeviceId } from '@/lib/utils';
import { QuickExit } from '@/components/QuickExit';

export function YouthLearn() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<LearningContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LearningContent | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [reading, setReading] = useState(false);

  const deviceId = getDeviceId();

  useEffect(() => {
    loadLessons();
    loadBadges();
  }, []);

  const loadLessons = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data, error: err } = await supabase
        .from('learning_content')
        .select('*')
        .in('age_band', ['6-9', '10-13', '14-17'])
        .order('sort_order');
      if (err) throw err;
      setLessons(data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadBadges = async () => {
    try {
      const { data } = await supabase
        .from('learning_progress')
        .select('lesson_id')
        .eq('device_id', deviceId)
        .eq('badge_earned', true);
      if (data) setEarnedBadges(data.map((d) => d.lesson_id));
    } catch {
      // badges load is non-critical
    }
  };

  const recordBadge = async (lessonId: string) => {
    try {
      await supabase.from('learning_progress').insert({
        device_id: deviceId,
        lesson_id: lessonId,
        badge_earned: true,
      });
      setEarnedBadges([...earnedBadges, lessonId]);
    } catch {
      // non-critical
    }
  };

  const readAloud = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    setReading(true);
    utterance.onend = () => setReading(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopReading = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setReading(false);
    }
  };

  if (selectedLesson) {
    const step = selectedLesson.steps[currentStep];
    const isLastStep = currentStep === selectedLesson.steps.length - 1;
    const quizScore = selectedLesson.quiz.reduce((acc, q, i) => {
      return acc + (quizAnswers[i] === q.answer_index ? 1 : 0);
    }, 0);
    const allCorrect = quizSubmitted && quizScore === selectedLesson.quiz.length;

    return (
      <div className="min-h-screen bg-youth-cream">
        <QuickExit />
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto max-w-3xl px-4 py-3">
            <button
              onClick={() => {
                stopReading();
                setSelectedLesson(null);
                setQuizAnswers({});
                setQuizSubmitted(false);
                setCurrentStep(0);
              }}
              className="flex items-center gap-2 rounded-full bg-youth-cream px-4 py-2 text-sm font-semibold text-youth-navy"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="mb-4 text-center">
            <span className="text-4xl">{selectedLesson.badge_emoji}</span>
            <h1 className="mt-2 font-heading text-2xl font-bold text-youth-navy">{selectedLesson.title}</h1>
            <p className="mt-1 text-sm text-youth-navy/60">{selectedLesson.description}</p>
          </div>

          {/* Progress dots */}
          <div className="mb-6 flex justify-center gap-2">
            {selectedLesson.steps.map((_, i) => (
              <div
                key={i}
                className={`h-2.5 rounded-full transition-all ${
                  i === currentStep ? 'w-8 bg-youth-blue' : i < currentStep ? 'w-2.5 bg-youth-mint' : 'w-2.5 bg-youth-lavender/30'
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          {!quizSubmitted ? (
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <div className="mb-4 text-7xl animate-breathe">{step.emoji}</div>
              <p className="font-heading text-lg font-semibold text-youth-navy leading-relaxed">{step.text}</p>
              <button
                onClick={() => reading ? stopReading() : readAloud(step.text)}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-youth-blue/10 px-4 py-2 text-sm font-semibold text-youth-blue"
              >
                <Volume2 className="h-4 w-4" />
                {reading ? 'Stop' : 'Read to me'}
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-4 rounded-3xl bg-white p-6 text-center shadow-sm">
                <span className="text-5xl">{allCorrect ? '🎉' : '💪'}</span>
                <p className="mt-2 font-heading text-xl font-bold text-youth-navy">
                  You scored {quizScore} out of {selectedLesson.quiz.length}!
                </p>
                {allCorrect && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-youth-mint/20 px-4 py-2">
                    <Star className="h-5 w-5 text-youth-yellow" />
                    <span className="font-heading font-bold text-youth-navy">Badge earned: {selectedLesson.badge_emoji}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  if (allCorrect) recordBadge(selectedLesson.id);
                  stopReading();
                  setSelectedLesson(null);
                  setQuizAnswers({});
                  setQuizSubmitted(false);
                  setCurrentStep(0);
                }}
                className="w-full rounded-3xl bg-youth-blue px-6 py-4 font-heading text-lg font-bold text-white shadow-lg"
              >
                Back to Lessons
              </button>
            </div>
          )}

          {/* Navigation */}
          {!quizSubmitted && (
            <div className="mt-4">
              {isLastStep ? (
                <div>
                  <h2 className="mb-3 text-center font-heading text-lg font-bold text-youth-navy">Quick Quiz!</h2>
                  <div className="space-y-4">
                    {selectedLesson.quiz.map((q, qi) => (
                      <div key={qi} className="rounded-3xl bg-white p-4 shadow-sm">
                        <p className="font-heading font-bold text-youth-navy">{qi + 1}. {q.question}</p>
                        <div className="mt-3 space-y-2">
                          {q.options.map((opt, oi) => {
                            const isSelected = quizAnswers[qi] === oi;
                            return (
                              <button
                                key={oi}
                                onClick={() => setQuizAnswers({ ...quizAnswers, [qi]: oi })}
                                className={`flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                                  isSelected
                                    ? 'bg-youth-blue text-white'
                                    : 'bg-youth-cream text-youth-navy hover:bg-youth-lavender/10'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setQuizSubmitted(true)}
                    disabled={Object.keys(quizAnswers).length < selectedLesson.quiz.length}
                    className="mt-4 w-full rounded-3xl bg-youth-mint px-6 py-4 font-heading text-lg font-bold text-white shadow-lg disabled:opacity-50"
                  >
                    Submit Quiz
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { stopReading(); setCurrentStep(currentStep + 1); }}
                  className="w-full rounded-3xl bg-youth-blue px-6 py-4 font-heading text-lg font-bold text-white shadow-lg"
                >
                  Next
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-youth-cream">
      <QuickExit />
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <button
            onClick={() => navigate('/youth')}
            className="flex items-center gap-2 rounded-full bg-youth-cream px-4 py-2 text-sm font-semibold text-youth-navy"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6 text-center">
          <span className="text-4xl">🦉</span>
          <h1 className="mt-2 font-heading text-2xl font-bold text-youth-navy">Learn & Play</h1>
          <p className="mt-1 text-sm text-youth-navy/60">Tap a lesson to start learning. Earn badges!</p>
        </div>

        {/* Badges earned */}
        {earnedBadges.length > 0 && (
          <div className="mb-6 rounded-3xl bg-youth-yellow/10 p-4 text-center">
            <p className="font-heading font-bold text-youth-navy">Your Badges</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {earnedBadges.map((id) => {
                const lesson = lessons.find((l) => l.id === id);
                return lesson ? (
                  <span key={id} className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm">
                    <Star className="h-4 w-4 text-youth-yellow" /> {lesson.badge_emoji}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-youth-blue" />
            <p className="mt-3 text-sm text-youth-navy/60">Loading lessons...</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center py-20 text-center">
            <AlertCircle className="h-10 w-10 text-danger" />
            <p className="mt-3 text-sm text-youth-navy/70">Could not load lessons.</p>
            <button onClick={loadLessons} className="mt-4 rounded-full bg-youth-blue px-5 py-2.5 text-sm font-semibold text-white">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-3">
            {lessons.map((lesson) => {
              const earned = earnedBadges.includes(lesson.id);
              return (
                <button
                  key={lesson.id}
                  onClick={() => setSelectedLesson(lesson)}
                  className="flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                >
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${earned ? 'bg-youth-yellow/20' : 'bg-youth-cream'}`}>
                    {lesson.badge_emoji}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-youth-navy">{lesson.title}</h3>
                    <p className="text-sm text-youth-navy/60">{lesson.description}</p>
                    <span className="mt-1 inline-block rounded-full bg-youth-lavender/10 px-2 py-0.5 text-xs font-semibold text-youth-lavender">
                      {lesson.age_band} years
                    </span>
                  </div>
                  {earned && <Star className="h-6 w-6 text-youth-yellow" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Fake call button */}
        <div className="mt-6">
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(200);
              readAloud('Remember, you can always call Childline on 116. They are there for you, any time, day or night.');
            }}
            className="flex w-full items-center justify-center gap-3 rounded-3xl bg-youth-mint px-6 py-5 font-heading text-lg font-bold text-white shadow-lg"
          >
            <Phone className="h-7 w-7" /> Practice Calling 116
          </button>
        </div>

        <button
          onClick={() => navigate('/youth')}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 font-heading font-semibold text-youth-navy shadow-sm"
        >
          <Home className="h-5 w-5" /> Home
        </button>
      </div>
    </div>
  );
}
