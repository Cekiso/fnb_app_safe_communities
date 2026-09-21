import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, AlertCircle, RefreshCw, ChevronRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase, type LearningContent } from '@/lib/supabase';
import { QuickExit } from '@/components/QuickExit';

export function Resources() {
  const { t } = useTranslation();
  const [articles, setArticles] = useState<LearningContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<LearningContent | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data, error: err } = await supabase
        .from('learning_content')
        .select('*')
        .eq('age_band', 'adult')
        .order('sort_order');
      if (err) throw err;
      setArticles(data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (selected) {
    const quizScore = selected.quiz.reduce((acc, q, i) => {
      return acc + (quizAnswers[i] === q.answer_index ? 1 : 0);
    }, 0);

    return (
      <div className="min-h-screen bg-adult-sand">
        <QuickExit />
        <div className="mx-auto max-w-2xl px-4 py-6">
          <button
            onClick={() => { setSelected(null); setQuizAnswers({}); setQuizSubmitted(false); }}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-adult-teal"
          >
            <ArrowLeft className="h-4 w-4" /> Back to resources
          </button>

          <h1 className="font-heading text-2xl font-bold text-adult-navy">{selected.title}</h1>
          <p className="mt-2 text-sm text-adult-navy/70">{selected.description}</p>

          {/* Steps */}
          <div className="mt-6 space-y-4">
            {selected.steps.map((step, i) => (
              <div key={i} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-adult-sand-dark">
                <span className="text-3xl">{step.emoji}</span>
                <div>
                  <span className="text-xs font-semibold text-adult-teal">Step {i + 1}</span>
                  <p className="mt-0.5 text-sm leading-relaxed text-adult-navy">{step.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quiz */}
          <div className="mt-8">
            <h2 className="font-heading text-lg font-bold text-adult-navy">Quick Check</h2>
            <p className="text-sm text-adult-navy/60">Test your understanding (3 questions)</p>
            <div className="mt-4 space-y-4">
              {selected.quiz.map((q, qi) => (
                <div key={qi} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-adult-sand-dark">
                  <p className="font-semibold text-adult-navy">{qi + 1}. {q.question}</p>
                  <div className="mt-3 space-y-2">
                    {q.options.map((opt, oi) => {
                      const isSelected = quizAnswers[qi] === oi;
                      const isCorrect = quizSubmitted && oi === q.answer_index;
                      const isWrong = quizSubmitted && isSelected && oi !== q.answer_index;
                      return (
                        <button
                          key={oi}
                          onClick={() => !quizSubmitted && setQuizAnswers({ ...quizAnswers, [qi]: oi })}
                          className={`flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                            isCorrect ? 'bg-green-100 text-green-700 ring-1 ring-green-300' :
                            isWrong ? 'bg-red-100 text-red-700 ring-1 ring-red-300' :
                            isSelected ? 'bg-adult-teal/10 text-adult-teal ring-1 ring-adult-teal/30' :
                            'bg-adult-sand text-adult-navy/70 hover:bg-adult-sand-dark'
                          }`}
                        >
                          {isCorrect && <CheckCircle2 className="h-4 w-4" />}
                          {isWrong && <AlertCircle className="h-4 w-4" />}
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {!quizSubmitted ? (
              <button
                onClick={() => setQuizSubmitted(true)}
                disabled={Object.keys(quizAnswers).length < selected.quiz.length}
                className="mt-4 w-full rounded-xl bg-adult-teal px-6 py-3 font-heading font-bold text-white shadow-sm disabled:opacity-50"
              >
                Submit Answers
              </button>
            ) : (
              <div className="mt-4 rounded-xl bg-adult-teal/10 p-4 text-center">
                <p className="font-heading text-lg font-bold text-adult-teal">
                  You scored {quizScore} / {selected.quiz.length}
                </p>
                <p className="mt-1 text-sm text-adult-navy/70">
                  {quizScore === selected.quiz.length ? 'Perfect! You understand this topic well.' : 'Good effort. Review the steps and try again.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-adult-sand">
      <QuickExit />
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <h1 className="font-heading text-xl font-bold text-adult-navy">{t('adult.resources')}</h1>
          <p className="text-sm text-adult-navy/60">Learn about GBV, your rights, and safety planning.</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-5">
        {loading && (
          <div className="flex flex-col items-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-adult-teal" />
            <p className="mt-3 text-sm text-adult-navy/60">Loading resources...</p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center py-20 text-center">
            <AlertCircle className="h-10 w-10 text-danger" />
            <p className="mt-3 text-sm text-adult-navy/70">Could not load resources.</p>
            <button onClick={loadArticles} className="mt-4 rounded-full bg-adult-teal px-5 py-2.5 text-sm font-semibold text-white">Retry</button>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-3">
            {articles.length === 0 && <p className="py-8 text-center text-sm text-adult-navy/50">No articles available.</p>}
            {articles.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-adult-sand-dark transition-all hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-adult-teal/10">
                  <BookOpen className="h-6 w-6 text-adult-teal" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-bold text-adult-navy">{a.title}</h3>
                  <p className="text-sm text-adult-navy/60">{a.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-adult-navy/40" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
